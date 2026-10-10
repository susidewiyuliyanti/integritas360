import { Env, json, getCookie, verifyPassword, hashPassword } from '../_utils';

const OWNER_EMAIL = 'support.integritas360@gmail.com';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const sid = getCookie(request, 'i360_session');
    if (!sid) return json({ ok: false, error: 'Sesi login tidak ditemukan. Silakan masuk kembali.' }, 401);

    const user = await env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.password_hash, u.password_salt
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `).bind(sid).first<any>();

    if (!user || user.role !== 'owner' || String(user.email).toLowerCase() !== OWNER_EMAIL) {
      return json({ ok: false, error: 'Hanya Owner yang berwenang mengubah kata sandi.' }, 403);
    }

    const body = await request.json().catch(() => ({})) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    const confirmPassword = String(body.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return json({ ok: false, error: 'Semua kolom kata sandi wajib diisi.' }, 400);
    }
    if (newPassword.length < 10) {
      return json({ ok: false, error: 'Kata sandi baru minimal 10 karakter.' }, 400);
    }
    if (newPassword !== confirmPassword) {
      return json({ ok: false, error: 'Konfirmasi kata sandi baru tidak cocok.' }, 400);
    }
    if (newPassword === currentPassword) {
      return json({ ok: false, error: 'Kata sandi baru harus berbeda dari kata sandi saat ini.' }, 400);
    }

    const currentValid = await verifyPassword(currentPassword, user.password_salt, user.password_hash);
    if (!currentValid) return json({ ok: false, error: 'Kata sandi saat ini tidak benar.' }, 401);

    const { salt, hash } = await hashPassword(newPassword);
    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = ?'
    ).bind(hash, salt, user.id, 'owner').run();

    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(user.id, sid).run();
    await env.DB.prepare(
      'INSERT INTO audit_logs (id, actor_user_id, actor_email, actor_role, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      crypto.randomUUID(), user.id, user.email, user.role, 'owner_password_changed', 'user', user.id,
      JSON.stringify({ changedAt: new Date().toISOString() })
    ).run();

    return json({ ok: true, message: 'Kata sandi Owner berhasil diperbarui.' });
  } catch (error) {
    console.error('OWNER_PASSWORD_CHANGE_ERROR', error);
    return json({ ok: false, error: 'Terjadi kesalahan server saat mengubah kata sandi.' }, 500);
  }
};
