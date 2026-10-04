import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, OWNER_EMAIL, isOwnerEmail } from '../lib/firebase';
import { UserProfile, UserRole, Company, CompanyUser } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  company: Company | null;
  companyUser: CompanyUser | null;
  isCompanySuspended: boolean;
  loading: boolean;
  role: UserRole | null;
  isOwner: boolean;
  logout: () => Promise<void>;
  refreshCompanyData?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  company: null,
  companyUser: null,
  isCompanySuspended: false,
  loading: true,
  role: null,
  isOwner: false,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [isCompanySuspended, setIsCompanySuspended] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load company & company_user documents by company_id or user_id
  const resolveTenantData = async (uid: string, userEmail?: string | null) => {
    if (!userEmail) return;
    try {
      // 1. Check in company_users collection first
      let foundCompUser: CompanyUser | null = null;
      const qCompUser = query(collection(db, 'company_users'), where('user_id', '==', uid), limit(1));
      const compUserSnap = await getDocs(qCompUser);
      if (!compUserSnap.empty) {
        const d = compUserSnap.docs[0].data();
        foundCompUser = { id: compUserSnap.docs[0].id, ...(d as any) } as CompanyUser;
      } else {
        // Fallback by email
        const qCompUserEmail = query(collection(db, 'company_users'), where('email', '==', userEmail.toLowerCase()), limit(1));
        const compUserEmailSnap = await getDocs(qCompUserEmail);
        if (!compUserEmailSnap.empty) {
          const d = compUserEmailSnap.docs[0].data();
          foundCompUser = { id: compUserEmailSnap.docs[0].id, ...(d as any) } as CompanyUser;
        }
      }
      setCompanyUser(foundCompUser);

      // 2. Resolve company_id from company_users or profile
      const targetCompanyId = foundCompUser?.company_id;
      if (targetCompanyId) {
        // Query companies collection
        const qComp = query(collection(db, 'companies'), where('company_id', '==', targetCompanyId), limit(1));
        const compSnap = await getDocs(qComp);
        if (!compSnap.empty) {
          const cData = compSnap.docs[0].data();
          const compObj: Company = { id: compSnap.docs[0].id, ...(cData as any) } as Company;
          setCompany(compObj);
          setIsCompanySuspended(compObj.status === 'SUSPENDED');
        } else {
          // Check by doc id
          const compDoc = await getDoc(doc(db, 'companies', targetCompanyId));
          if (compDoc.exists()) {
            const compObj: Company = { id: compDoc.id, ...(compDoc.data() as any) } as Company;
            setCompany(compObj);
            setIsCompanySuspended(compObj.status === 'SUSPENDED');
          }
        }
      }
    } catch (err) {
      console.warn('Error resolving tenant data in AuthContext:', err);
    }
  };

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!currentUser) {
        setProfile(null);
        setCompany(null);
        setCompanyUser(null);
        setIsCompanySuspended(false);
        setLoading(false);
        return;
      }

      const uid = currentUser.uid;
      const userRef = doc(db, 'users', uid);
      const isOwnerUser = isOwnerEmail(currentUser.email);
      const defaultRole: UserRole = isOwnerUser ? 'owner' : 'perusahaan';

      // Provide immediate fallback profile so the app remains fully functional even if offline
      setProfile((prev) => prev || {
        uid,
        email: currentUser.email || '',
        picName: currentUser.email || '',
        role: defaultRole,
        namaPT: currentUser.displayName || (isOwnerUser ? 'INTEGRITAS360 Admin' : 'PT'),
        sektor: isOwnerUser ? 'Dewan Pengawas' : '-',
        alamat: 'Indonesia',
        deskripsi: isOwnerUser ? 'Super Admin Integritas360' : '-',
        danaTersedia: 0,
        saldo: 0,
        createdAt: undefined,
      });

      // Resolve tenant data asynchronously
      if (!isOwnerUser) {
        resolveTenantData(uid, currentUser.email);
      }

      // Realtime listener for active user profile with offline tolerance
      unsubscribeDoc = onSnapshot(
        userRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let effectiveRole: UserRole = (data.role as UserRole) || defaultRole;
            if (isOwnerEmail(currentUser.email)) {
              effectiveRole = 'owner';
            }
            setProfile({
              uid,
              email: data.email || currentUser.email || '',
              role: effectiveRole,
              namaPT: data.namaPT || 'PT',
              picName: data.picName || currentUser.email || '',
              sektor: data.sektor || '-',
              alamat: data.alamat || '-',
              deskripsi: data.deskripsi || '-',
              danaTersedia: Number(data.danaTersedia || 0),
              saldo: Number(data.saldo || 0),
              createdAt: data.createdAt,
              statusVerifikasiDokumen: data.statusVerifikasiDokumen,
              spesialisasiAudit: data.spesialisasiAudit,
              gelarProfesi: data.gelarProfesi,
              nomorLisensi: data.nomorLisensi,
              biayaJasaPerKasus: data.biayaJasaPerKasus || data.biayaJasaInvestigasi,
              kebijakanReward: data.kebijakanReward,
              danaTerkunci: data.danaTerkunci,
              photoURL: data.photoURL,
              perusahaanId: data.perusahaanId || data.company_id,
              perusahaanName: data.perusahaanName || data.company_name || data.namaPT,
              company_id: data.company_id || data.perusahaanId,
              company_code: data.company_code,
              company_name: data.company_name || data.namaPT,
              jabatan: data.jabatan,
              departemen: data.departemen,
              statusAkun: data.statusAkun || 'aktif',
              namaBank: data.namaBank || data.bankName,
              nomorRekening: data.nomorRekening,
              pemilikRekening: data.pemilikRekening || data.namaPemilikRekening,
            });

            // Ensure owner role is synchronized if needed
            if (isOwnerUser && data.role !== 'owner') {
              setDoc(userRef, { role: 'owner' }, { merge: true }).catch(() => {});
            }

            // Sync company data if company_id is found in user profile
            const compId = data.company_id || data.perusahaanId;
            if (compId && !isOwnerUser) {
              const qComp = query(collection(db, 'companies'), where('company_id', '==', compId), limit(1));
              const compSnap = await getDocs(qComp).catch(() => null);
              if (compSnap && !compSnap.empty) {
                const cData = compSnap.docs[0].data();
                setCompany({ id: compSnap.docs[0].id, ...(cData as any) } as Company);
                setIsCompanySuspended(cData.status === 'SUSPENDED');
              }
            }
          } else {
            // First time login doc initialization
            (async () => {
              try {
                if (currentUser.email) {
                  const q = query(
                    collection(db, 'users'),
                    where('email', '==', currentUser.email.toLowerCase()),
                    limit(1)
                  );
                  const qSnap = await getDocs(q);
                  if (!qSnap.empty) {
                    const existingData = qSnap.docs[0].data();
                    const effectiveRole: UserRole = isOwnerUser ? 'owner' : ((existingData.role as UserRole) || defaultRole);
                    const mergedProfile: UserProfile = {
                      ...existingData,
                      uid,
                      email: currentUser.email,
                      role: effectiveRole,
                      namaPT: existingData.namaPT || (isOwnerUser ? 'INTEGRITAS360 Admin' : 'PT'),
                      picName: existingData.picName || currentUser.email,
                      sektor: existingData.sektor || '-',
                      alamat: existingData.alamat || '-',
                      deskripsi: existingData.deskripsi || '-',
                      danaTersedia: Number(existingData.danaTersedia || 0),
                      saldo: Number(existingData.saldo || 0),
                      danaTerkunci: Number(existingData.danaTerkunci || 0),
                      statusVerifikasiDokumen: existingData.statusVerifikasiDokumen,
                      company_id: existingData.company_id || existingData.perusahaanId,
                      company_name: existingData.company_name || existingData.namaPT,
                      createdAt: existingData.createdAt || serverTimestamp(),
                    };
                    setProfile(mergedProfile);
                    await setDoc(userRef, mergedProfile, { merge: true }).catch(() => {});
                    setLoading(false);
                    return;
                  }
                }
              } catch (err) {
                console.warn('Could not check existing doc by email in AuthContext:', err);
              }

              const initialData: UserProfile = {
                uid,
                email: currentUser.email || '',
                picName: currentUser.email || '',
                role: defaultRole,
                namaPT: currentUser.displayName || (isOwnerUser ? 'INTEGRITAS360 Admin' : 'PT Baru Terdaftar'),
                sektor: isOwnerUser ? 'Dewan Integritas & Pengawasan' : 'Manufaktur & Bisnis',
                alamat: 'Indonesia',
                deskripsi: isOwnerUser ? 'Super Admin Integritas360' : 'Perusahaan Kepatuhan Integritas360',
                danaTersedia: 0,
                saldo: 0,
                createdAt: serverTimestamp(),
              };
              setDoc(userRef, initialData, { merge: true }).catch((err) => {
                console.warn('Background user doc creation pending sync:', err);
              });
            })();
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Realtime profile listener fallback (offline or pending):', error.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setCompany(null);
    setCompanyUser(null);
    setIsCompanySuspended(false);
    setUser(null);
  };

  const isOwner = isOwnerEmail(user?.email) || profile?.role === 'owner';
  const role = isOwner ? 'owner' : profile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        company,
        companyUser,
        isCompanySuspended,
        loading,
        role,
        isOwner,
        logout,
        refreshCompanyData: async () => {
          if (user) resolveTenantData(user.uid, user.email);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
