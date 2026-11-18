import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole, Company, CompanyUser } from '../types';

type SessionUser = {
  id: string;
  uid?: string;
  email: string;
  role: UserRole;
  company_id?: string | null;
  status?: string;
  [key: string]: any;
};

interface AuthContextType {
  user: SessionUser | null;
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

const SESSION_HINT_KEY = 'i360_session_user';

const readSessionHint = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_HINT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || typeof value.id !== 'string' || typeof value.email !== 'string' || typeof value.role !== 'string') return null;
    return value as SessionUser;
  } catch {
    return null;
  }
};

const saveSessionHint = (value: SessionUser | null) => {
  try {
    if (value) {
      // This is only a UI bootstrap hint, never an authentication credential.
      // Every protected API continues to validate the HttpOnly D1 session cookie.
      localStorage.setItem(SESSION_HINT_KEY, JSON.stringify({
        id: value.id,
        email: value.email,
        role: value.role,
        company_id: value.company_id || null,
        status: value.status || 'ACTIVE',
      }));
    } else {
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Storage may be disabled; server-cookie authentication still works.
  }
};

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

const toProfile = (u: SessionUser): UserProfile => ({
  ...(u as any),
  uid: u.uid || u.id,
  email: u.email || '',
  role: u.role,
  picName: u.picName || u.email || '',
  namaPT: u.namaPT || u.company_name || (u.role === 'owner' ? 'INTEGRITAS360 Admin' : 'PT'),
  sektor: u.sektor || (u.role === 'owner' ? 'Dewan Pengawas' : '-'),
  alamat: u.alamat || 'Indonesia',
  deskripsi: u.deskripsi || (u.role === 'owner' ? 'Super Admin Integritas360' : '-'),
  danaTersedia: Number(u.danaTersedia || 0),
  saldo: Number(u.saldo || 0),
  perusahaanId: u.perusahaanId || u.company_id,
  perusahaanName: u.perusahaanName || u.company_name || u.namaPT,
  company_id: u.company_id || u.perusahaanId,
  company_name: u.company_name || u.namaPT,
  statusAkun: u.statusAkun || 'aktif',
} as UserProfile);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(() => readSessionHint());
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const hint = readSessionHint();
    return hint ? toProfile(hint) : null;
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [isCompanySuspended, setIsCompanySuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearLocalSession = () => {
    saveSessionHint(null);
    setUser(null);
    setProfile(null);
    setCompany(null);
    setCompanyUser(null);
    setIsCompanySuspended(false);
  };

  const loadSession = async () => {
    let response: Response;
    try {
      response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache' },
      });
    } catch (error) {
      // A temporary network failure must not erase the signed-in dashboard state.
      // Keep the non-secret UI hint; protected requests remain secured by the server.
      console.warn('Cloudflare session check temporarily unavailable:', error);
      setLoading(false);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      clearLocalSession();
      setLoading(false);
      return;
    }

    if (!response.ok) {
      // 5xx/edge errors are not proof that the user's session has ended.
      console.warn('Cloudflare session check returned:', response.status);
      setLoading(false);
      return;
    }

    try {
      const data = await response.json();
      if (!data?.ok || !data?.user) {
        clearLocalSession();
        setLoading(false);
        return;
      }

      const sessionUser = data.user as SessionUser;
      saveSessionHint(sessionUser);
      setUser(sessionUser);

      let finalProfile = toProfile(sessionUser);
      if (sessionUser.company_id) {
        try {
          const companyResponse = await fetch('/api/company/me', {
            credentials: 'include',
            cache: 'no-store',
            headers: { 'cache-control': 'no-cache' },
          });
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            if (companyData?.company) {
              setCompany(companyData.company as Company);
              setIsCompanySuspended(companyData.company.status === 'SUSPENDED');
            }
            if (companyData?.companyUser) setCompanyUser(companyData.companyUser as CompanyUser);
            if (companyData?.profile) finalProfile = { ...finalProfile, ...companyData.profile };
          }
        } catch (error) {
          console.warn('Tenant profile refresh temporarily unavailable:', error);
        }
      }
      setProfile(finalProfile);
    } catch (error) {
      // A malformed/transient response should not force a logout.
      console.warn('Cloudflare session response could not be processed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearLocalSession();
    }
  };

  const isOwner = user?.role === 'owner' || profile?.role === 'owner';
  const role = isOwner ? 'owner' : profile?.role || user?.role || null;

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
        refreshCompanyData: loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
