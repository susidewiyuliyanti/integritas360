import type { PagesFunction } from '@cloudflare/workers-types';
import { json, getCookie, Env } from '../_utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const sid = getCookie(request, 'i360_session');
    if (!sid) return json({ error: 'Unauthorized' }, 401);

    const user = await env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.status
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1
    `).bind(sid).first<any>();

    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (String(user.role || '').toLowerCase() !== 'owner') return json({ error: 'Forbidden' }, 403);

    const [companies, reports, transactions, auditLogs] = await Promise.all([
      env.DB.prepare('SELECT * FROM companies ORDER BY created_at DESC LIMIT 1000').all<any>(),
      env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 2000').all<any>(),
      env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 3000').all<any>(),
      env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000').all<any>(),
    ]);

    const companyRows = (companies.results || []).map((c:any) => {
      let meta:any = {};
      try { meta = JSON.parse(c.metadata_json || '{}'); } catch {}
      return { ...meta, ...c, id: c.id, company_id: c.company_id || c.id, company_name: c.company_name || meta.namaPT || meta.company_name, deposit_balance: c.deposit_balance ?? meta.danaTersedia ?? meta.saldo ?? 0, locked_balance: c.locked_balance ?? meta.danaTerkunci ?? 0 };
    });
    const reportRows = (reports.results || []).map((r:any) => {
      let meta:any = {};
      try { meta = JSON.parse(r.metadata_json || '{}'); } catch {}
      return { ...meta, ...r, company_id: r.company_id, report_code: r.report_code, title: r.title || meta.judul, category: r.category || meta.kategori, estimated_loss: r.estimated_loss ?? meta.estimasiKerugian ?? 0 };
    });
    const txRows = (transactions.results || []).map((t:any) => {
      let meta:any = {};
      try { meta = JSON.parse(t.metadata_json || '{}'); } catch {}
      return { ...meta, ...t, company_id: t.company_id, type: t.type, amount: t.amount, status: t.status };
    });
    const auditRows = (auditLogs.results || []).map((a:any) => {
      let meta:any = {};
      try { meta = JSON.parse(a.metadata_json || '{}'); } catch {}
      return { ...meta, ...a, metadata: meta };
    });

    return json({ ok: true, viewer: { id: user.id, email: user.email, role: user.role }, companies: companyRows, reports: reportRows, transactions: txRows, auditLogs: auditRows });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Gagal memuat ringkasan admin' }, 500);
  }
};


export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const sid = getCookie(request, 'i360_session');
    if (!sid) return json({ error: 'Unauthorized' }, 401);
    const actor = await env.DB.prepare(`
      SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.id=? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1
    `).bind(sid).first<any>();
    if (!actor || String(actor.role || '').toLowerCase() !== 'owner') return json({ error: 'Forbidden' }, 403);
    const body = await request.json<any>();
    const id = String(body.id || '').trim();
    const action = String(body.action || '').toLowerCase();
    const reason = String(body.reason || '').trim();
    const validActions = ['approve-deposit','reject-deposit','approve-withdrawal','reject-withdrawal','complete-claim_reward'];
    if (!id || !validActions.includes(action)) return json({ error: 'Permintaan tidak valid.' }, 400);
    const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id=? LIMIT 1').bind(id).first<any>();
    if (!tx) return json({ error: 'Transaksi tidak ditemukan di database utama.' }, 404);
    const type = String(tx.type || '').toLowerCase();
    if (action === 'complete-claim_reward') {
      if (type !== 'claim_reward') return json({ error: 'Aksi ini hanya untuk klaim reward pelapor.' }, 400);
      if (String(tx.status || '').toLowerCase() !== 'pending') return json({ error: 'Klaim reward sudah diproses sebelumnya.' }, 409);
      const reportId = String(tx.report_id || '');
      if (!reportId) return json({ error: 'ID laporan klaim tidak ditemukan.' }, 409);
      let claimMeta:any = {}; try { claimMeta = JSON.parse(tx.metadata_json || '{}'); } catch {}
      const amount = Number(tx.amount || 0);
      const companyId = String(tx.company_id || '');
      if (!companyId || !Number.isFinite(amount) || amount <= 0) return json({ error: 'Data tenant atau nominal reward tidak valid.' }, 400);
      // Reward release normally debits the tenant balance before the reporter claims it.
      // Some older investigation flows marked the claim as released without writing that debit.
      // If no reward_release ledger exists for this report, debit exactly once here.
      const priorRelease = await env.DB.prepare(`SELECT id FROM transactions WHERE company_id=? AND report_id=? AND type='reward_release' LIMIT 1`).bind(companyId,reportId).first<any>();
      if (!priorRelease) {
        const company = await env.DB.prepare('SELECT deposit_balance FROM companies WHERE company_id=? LIMIT 1').bind(companyId).first<any>();
        if (!company || Number(company.deposit_balance || 0) < amount) return json({ error: 'Saldo tenant tidak mencukupi untuk menyelesaikan reward.', balance: Number(company?.deposit_balance || 0), required: amount }, 409);
      }
      const operationId = 'claimpaid_' + crypto.randomUUID();
      const nextMeta = { ...claimMeta, processedAt: new Date().toISOString(), processedBy: actor.email, paymentStatus: 'transferred_by_platform_admin', paymentOperationId: operationId, adminPaymentNote: 'Admin platform mengonfirmasi transfer manual' };
      const statements = [
        env.DB.prepare(`UPDATE transactions SET status='selesai',metadata_json=? WHERE id=? AND type='claim_reward' AND status='pending'`).bind(JSON.stringify(nextMeta),id),
        env.DB.prepare(`UPDATE companies SET deposit_balance=COALESCE(deposit_balance,0)-?,updated_at=CURRENT_TIMESTAMP
          WHERE company_id=? AND EXISTS (SELECT 1 FROM transactions WHERE id=? AND status='selesai' AND json_extract(metadata_json,'$.paymentOperationId')=?)
          AND NOT EXISTS (SELECT 1 FROM transactions WHERE company_id=? AND report_id=? AND type='reward_release')`).bind(amount,companyId,id,operationId,companyId,reportId),
        env.DB.prepare(`INSERT INTO transactions(id,user_id,company_id,type,amount,status,report_id,metadata_json)
          SELECT ?,?,?, 'reward_release', ?, 'selesai', ?, ?
          WHERE EXISTS (SELECT 1 FROM transactions WHERE id=? AND status='selesai' AND json_extract(metadata_json,'$.paymentOperationId')=?)
          AND NOT EXISTS (SELECT 1 FROM transactions WHERE company_id=? AND report_id=? AND type='reward_release')`)
          .bind('rewardpay_'+crypto.randomUUID(),tx.user_id,companyId,amount,reportId,JSON.stringify({description:'Debit saldo tenant saat konfirmasi pembayaran reward pelapor',claimTransactionId:id,operationId}),id,operationId,companyId,reportId),
        env.DB.prepare(`UPDATE reports SET reward_claim_status='selesai', reward_claimed=1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND reward_claim_status IN ('pending','siap_diklaim')`).bind(reportId),
        env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
          .bind('audit_'+crypto.randomUUID(),actor.id,actor.email,actor.role,companyId,'REPORT_REWARD_TRANSFERRED','report_reward_claim',reportId,JSON.stringify({transactionId:id,amount,operationId,tenantDebited:!priorRelease}))
      ];
      const results = await env.DB.batch(statements);
      if (!Number(results[0]?.meta?.changes || 0)) return json({ error: 'Klaim sudah diproses oleh admin lain.' }, 409);
      return json({ok:true,id,status:'selesai',paymentStatus:'transferred_by_platform_admin'});
    }
    const isDeposit = action.endsWith('-deposit') && type === 'deposit';
    const isWithdrawal = action.endsWith('-withdrawal') && type === 'withdrawal';
    if (!isDeposit && !isWithdrawal) return json({ error: 'Aksi tidak sesuai dengan jenis transaksi.' }, 400);
    if (String(tx.status || '').toLowerCase() !== 'pending') return json({ error: 'Transaksi sudah diproses sebelumnya.' }, 409);
    const companyId = String(tx.company_id || '');
    const amount = Number(tx.amount || 0);
    if (!companyId || !Number.isFinite(amount) || amount <= 0) return json({ error: 'Data tenant atau nominal transaksi tidak valid.' }, 400);
    const isApproval = action.startsWith('approve-');
    if (isApproval && isDeposit) {
      const operationId = 'depverify_' + crypto.randomUUID();
      let meta:any = {}; try { meta = JSON.parse(tx.metadata_json || '{}'); } catch {}
      const nextMeta = { ...meta, processedAt: new Date().toISOString(), processedBy: actor.email, depositVerificationOperationId: operationId, verificationNote: 'Deposit disetujui owner' };
      await env.DB.batch([
        env.DB.prepare(`UPDATE transactions SET status='selesai',metadata_json=? WHERE id=? AND status='pending'`).bind(JSON.stringify(nextMeta),id),
        env.DB.prepare(`UPDATE companies SET deposit_balance=COALESCE(deposit_balance,0)+?,updated_at=CURRENT_TIMESTAMP
          WHERE company_id=? AND EXISTS (SELECT 1 FROM transactions WHERE id=? AND status='selesai' AND json_extract(metadata_json,'$.depositVerificationOperationId')=?)`).bind(amount,companyId,id,operationId),
        env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
          .bind('audit_'+crypto.randomUUID(),actor.id,actor.email,actor.role,companyId,'DEPOSIT_APPROVED','transaction',id,JSON.stringify({amount,operationId}))
      ]);
      const verified = await env.DB.prepare('SELECT status,metadata_json FROM transactions WHERE id=?').bind(id).first<any>();
      let verifiedMeta:any={}; try { verifiedMeta=JSON.parse(verified?.metadata_json||'{}'); } catch {}
      if (verified?.status !== 'selesai' || verifiedMeta.depositVerificationOperationId !== operationId) return json({ error: 'Deposit sudah diproses oleh admin lain; saldo tidak ditambahkan.' }, 409);
      return json({ ok:true,id,status:'selesai',creditedAmount:amount,companyId });
    }
    if (isApproval && isWithdrawal) {
      const operationId = 'withverify_' + crypto.randomUUID();
      let meta:any = {}; try { meta = JSON.parse(tx.metadata_json || '{}'); } catch {}
      const nextMeta = { ...meta, processedAt: new Date().toISOString(), processedBy: actor.email, withdrawalVerificationOperationId: operationId, verificationNote: 'Withdrawal disetujui owner' };
      await env.DB.batch([
        env.DB.prepare(`UPDATE transactions SET status='selesai',metadata_json=? WHERE id=? AND status='pending' AND EXISTS (SELECT 1 FROM companies WHERE company_id=? AND COALESCE(deposit_balance,0)>=?)`).bind(JSON.stringify(nextMeta),id,companyId,amount),
        env.DB.prepare(`UPDATE companies SET deposit_balance=COALESCE(deposit_balance,0)-?,updated_at=CURRENT_TIMESTAMP
          WHERE company_id=? AND EXISTS (SELECT 1 FROM transactions WHERE id=? AND status='selesai' AND json_extract(metadata_json,'$.withdrawalVerificationOperationId')=?)`).bind(amount,companyId,id,operationId),
        env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
          .bind('audit_'+crypto.randomUUID(),actor.id,actor.email,actor.role,companyId,'WITHDRAWAL_APPROVED','transaction',id,JSON.stringify({amount,operationId}))
      ]);
      const verified = await env.DB.prepare('SELECT status,metadata_json FROM transactions WHERE id=?').bind(id).first<any>();
      let verifiedMeta:any={}; try { verifiedMeta=JSON.parse(verified?.metadata_json||'{}'); } catch {}
      if (verified?.status !== 'selesai' || verifiedMeta.withdrawalVerificationOperationId !== operationId) return json({ error: 'Withdrawal tidak diproses: saldo mungkin tidak mencukupi atau transaksi sudah diproses.' }, 409);
      return json({ ok:true,id,status:'selesai',debitedAmount:amount,companyId });
    }
    if (!reason) return json({ error: 'Alasan penolakan wajib diisi.' }, 400);
    let meta:any = {}; try { meta=JSON.parse(tx.metadata_json||'{}'); } catch {}
    const nextMeta={...meta,catatanAdmin:reason,processedAt:new Date().toISOString(),processedBy:actor.email};
    const result=await env.DB.prepare(`UPDATE transactions SET status='ditolak',metadata_json=? WHERE id=? AND status='pending'`).bind(JSON.stringify(nextMeta),id).run();
    if (!Number(result.meta?.changes || 0)) return json({ error:'Transaksi sudah diproses sebelumnya.' },409);
    await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,actor_email,actor_role,company_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind('audit_'+crypto.randomUUID(),actor.id,actor.email,actor.role,companyId,isDeposit?'DEPOSIT_REJECTED':'WITHDRAWAL_REJECTED','transaction',id,JSON.stringify({reason})).run();
    return json({ok:true,id,status:'ditolak'});
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Gagal memproses transaksi deposit.' }, 500);
  }
};
