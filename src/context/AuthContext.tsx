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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [isCompanySuspended, setIsCompanySuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        setUser(null);
        setProfile(null);
        setCompany(null);
        setCompanyUser(null);
        setIsCompanySuspended(false);
        return;
      }

      const data = await response.json();
      if (!data?.ok || !data?.user) {
        setUser(null);
        return;
      }

      const sessionUser = data.user as SessionUser;
      setUser(sessionUser);
      setProfile(toProfile(sessionUser));

      if (sessionUser.company_id) {
        try {
          const companyResponse = await fetch('/api/company/me', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            if (companyData?.company) {
              setCompany(companyData.company as Company);
              setIsCompanySuspended(companyData.company.status === 'SUSPENDED');
            }
            if (companyData?.companyUser) {
              setCompanyUser(companyData.companyUser as CompanyUser);
            }
            if (companyData?.profile) {
              setProfile(companyData.profile as UserProfile);
            }
          }
        } catch {
          // Company API is optional during the auth migration.
        }
      }
    } catch (error) {
      console.warn('Cloudflare session check failed:', error);
      setUser(null);
      setProfile(null);
      setCompany(null);
      setCompanyUser(null);
      setIsCompanySuspended(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      setProfile(null);
      setCompany(null);
      setCompanyUser(null);
      setIsCompanySuspended(false);
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
