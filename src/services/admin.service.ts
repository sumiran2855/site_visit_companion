import { API_CONFIG } from "@/config/api.config";
import { HttpClient } from "@/lib/api/httpClient";
import { DEFAULT_EC_POWER_PDF_TEMPLATE } from "@/config/default-template.config";
import type { User, UserRole, UserProfile } from "@/types/auth";
import type {
  PendingAccessRequest,
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
  PDFTemplate,
  AdminDashboardMetrics,
  RetentionStorageMetrics,
  RetentionCleanupResult,
  ExpiringVisitItem,
} from "@/types/admin";

const CACHE_KEY_REQUESTS = "ecpower_cached_pending_requests";
const CACHE_KEY_MEMBERS = "ecpower_cached_members";
const CACHE_KEY_COMPANIES = "ecpower_cached_companies";
const CACHE_KEY_VISITS = "ecpower_cached_visits";
const CACHE_KEY_TEMPLATE = "ecpower_cached_pdf_template";
const CACHE_KEY_RETENTION_RUN = "ecpower_last_retention_run";

function getStorageItem(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, val: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, val);
  } catch {}
}

const isMockId = (id?: string | null): boolean => {
  if (!id) return false;
  return id.startsWith("req-00") || id.startsWith("usr-00") || id.startsWith("comp-00");
};

export function mapProfileToUser(profile: UserProfile | any, companyName?: string): User {
  const p = profile as any;
  const firstName = p.firstName ?? p.first_name ?? "";
  const middleName = p.middleName ?? p.middle_name ?? null;
  const lastName = p.lastName ?? p.last_name ?? "";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const companyId = p.companyId ?? p.company_id ?? null;
  const requestedCompany = p.requestedCompany ?? p.requested_company ?? null;
  const resolvedCompany = p.companyName ?? p.company_name ?? companyName ?? requestedCompany ?? null;
  
  const rawApproval = String(p.approvalStatus ?? p.approval_status ?? "").toLowerCase().trim();
  const rawStatus = String(p.status ?? "").toLowerCase().trim();
  const isApproved =
    rawApproval === "approved" ||
    (rawApproval === "" && rawStatus === "active");

  return {
    id: p.id,
    name: fullName || p.email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    middleName: middleName || undefined,
    email: p.email,
    role:
      p.role === "admin" ||
      p.role === "super_admin" ||
      p.role === "company_admin"
        ? "admin"
        : "user",
    status: isApproved ? "active" : "pending",
    companyId: companyId || null,
    companyName: resolvedCompany,
    requestedCompany: requestedCompany || null,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : p.created_at ? String(p.created_at) : new Date().toISOString(),
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : p.updated_at ? String(p.updated_at) : new Date().toISOString(),
  };
}

export class AdminService {
  /**
   * Helper to check if a request's requestedCompany matches a target company (name or ID)
   */
  static matchesCompany(
    requestedCompany?: string | null,
    targetCompany?: string | null,
    targetCompanyId?: string | null,
    companiesList?: Company[]
  ): boolean {
    if (!requestedCompany) return false;
    if (!targetCompany && !targetCompanyId) return true;

    const req = requestedCompany.trim().toLowerCase();
    const target = targetCompany?.trim().toLowerCase();
    const targetId = targetCompanyId?.trim().toLowerCase();

    // Direct ID match
    if (targetId && req === targetId) return true;

    // Direct exact name match
    if (target && req === target) return true;

    // Normalize legal suffixes (Inc., LLC, etc.) without false positive partial word matching
    const stripSuffix = (s: string) =>
      s
        .replace(/\b(inc|incorporated|llc|corp|corporation|ltd|limited|co|company)\b\.?/gi, "")
        .replace(/[^a-z0-9]/gi, "")
        .trim();

    if (target) {
      const cleanReq = stripSuffix(req);
      const cleanTarget = stripSuffix(target);
      if (cleanReq && cleanTarget && cleanReq === cleanTarget) {
        return true;
      }
    }

    if (companiesList && companiesList.length > 0) {
      const targetObj = companiesList.find(
        (c) =>
          (targetId && c.id.toLowerCase() === targetId) ||
          (target && (c.name.trim().toLowerCase() === target || stripSuffix(c.name) === stripSuffix(target)))
      );

      const reqObj = companiesList.find(
        (c) =>
          c.id.toLowerCase() === req ||
          c.name.trim().toLowerCase() === req ||
          (stripSuffix(c.name) && stripSuffix(c.name) === stripSuffix(req))
      );

      if (reqObj && targetObj && reqObj.id.toLowerCase() === targetObj.id.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Pending Access Requests
   */
  static async listPendingRequests(
    filterCompanyName?: string,
    filterCompanyId?: string,
    companiesList?: Company[]
  ): Promise<PendingAccessRequest[]> {
    let requests: PendingAccessRequest[] = [];
    const http = HttpClient.getInstance();

    try {
      const res = await http.get<any>(API_CONFIG.ENDPOINTS.ADMIN.REQUESTS);
      const data = res?.data || (Array.isArray(res) ? res : null);
      if (Array.isArray(data)) {
        const cleanData = data.filter((r) => !isMockId(r.id));
        setStorageItem(CACHE_KEY_REQUESTS, JSON.stringify(cleanData));
        requests = cleanData;
      }
    } catch {
      console.log("[AdminService] Failed to fetch requests from server, checking cache.");
    }

    if (requests.length === 0) {
      // Direct Supabase REST fallback
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const res = await fetch(
          `${API_CONFIG.SUPABASE_URL}/rest/v1/signup_requests?status=eq.pending&order=created_at.desc`,
          {
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
            },
          }
        );
        if (res.ok) {
          const rows = (await res.json()) as Array<Record<string, unknown>>;
          if (Array.isArray(rows) && rows.length > 0) {
            requests = rows.map((r) => ({
              id: String(r.id),
              firstName: String(r.first_name || ""),
              lastName: String(r.last_name || ""),
              middleName: typeof r.middle_name === "string" ? r.middle_name : undefined,
              email: String(r.email || ""),
              requestedCompany: String(r.requested_company || ""),
              createdAt: typeof r.created_at === "string" ? r.created_at : new Date().toISOString(),
            }));
            setStorageItem(CACHE_KEY_REQUESTS, JSON.stringify(requests));
          }
        }
      } catch (err) {
        console.warn("[AdminService] Supabase fallback for pending requests failed:", err);
      }
    }

    if (requests.length === 0) {
      const cached = getStorageItem(CACHE_KEY_REQUESTS);
      const list: PendingAccessRequest[] = cached ? JSON.parse(cached) : [];
      requests = list.filter((r) => !isMockId(r.id));
    }

    if (filterCompanyName && filterCompanyName !== "all") {
      return requests.filter((r) =>
        this.matchesCompany(r.requestedCompany, filterCompanyName, filterCompanyId, companiesList)
      );
    }

    return requests;
  }

  static async approveRequest(
    requestId: string,
    companyId: string,
    companyName: string,
    role: UserRole
  ): Promise<{ success: boolean; user?: User }> {
    let approvedUser: User | undefined;
    let resolvedCompanyId = companyId;
    const http = HttpClient.getInstance();

    try {
      if (companyId.startsWith("pending-") || companyId.startsWith("comp-")) {
        const companies = await this.listCompanies();
        const existing = companies.find(
          (c) => c.name.trim().toLowerCase() === companyName.trim().toLowerCase()
        );
        if (existing) {
          resolvedCompanyId = existing.id;
        } else {
          try {
            const created = await this.createCompany({ name: companyName.trim() });
            if (created?.id) resolvedCompanyId = created.id;
          } catch {
            const fresh = await this.listCompanies();
            const found = fresh.find(
              (c) => c.name.trim().toLowerCase() === companyName.trim().toLowerCase()
            );
            if (found) resolvedCompanyId = found.id;
          }
        }
      }

      const res = await http.post<any>(
        API_CONFIG.ENDPOINTS.ADMIN.APPROVE_REQUEST(requestId),
        {
          companyId: resolvedCompanyId,
          role,
        }
      );
      const data = res?.data || res;
      if (data && (data.id || data.email)) {
        approvedUser = mapProfileToUser(data, companyName);
      }
    } catch (err) {
      console.warn("[AdminService] approveRequest network call failed:", err);
    }

    if (!approvedUser) {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const headers = {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        };
        // 1. Update signup_requests
        const sRes = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/signup_requests?id=eq.${requestId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "approved", updated_at: new Date().toISOString() }),
        });
        const updatedSignups = (await sRes.json().catch(() => [])) as Array<Record<string, unknown>>;
        const reqItem = updatedSignups[0];

        // 2. Update profiles if profile exists
        if (reqItem?.email) {
          const pRes = await fetch(
            `${API_CONFIG.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(String(reqItem.email))}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                approval_status: "approved",
                company_id: resolvedCompanyId,
                role: role === "admin" ? "admin" : "standard",
                updated_at: new Date().toISOString(),
              }),
            }
          );
          const updatedProfiles = (await pRes.json().catch(() => [])) as Array<Record<string, unknown>>;
          const profile = updatedProfiles[0];
          if (profile) {
            approvedUser = mapProfileToUser(profile, companyName);
          }

          // 3. Automatically append approved user's email to company's allowed_email_domains
          if (resolvedCompanyId) {
            try {
              const compRes = await fetch(
                `${API_CONFIG.SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(resolvedCompanyId)}`,
                { headers }
              );
              if (compRes.ok) {
                const compRows = (await compRes.json().catch(() => [])) as Array<Record<string, unknown>>;
                if (compRows[0]) {
                  const targetComp = compRows[0];
                  const userEmail = String(reqItem.email).trim().toLowerCase();
                  const currentDomains = Array.isArray(targetComp.allowed_email_domains)
                    ? (targetComp.allowed_email_domains as string[])
                    : [];
                  if (!currentDomains.some((d: string) => d.toLowerCase() === userEmail)) {
                    const newDomains = [...currentDomains, userEmail];
                    await fetch(
                      `${API_CONFIG.SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(resolvedCompanyId)}`,
                      {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({
                          allowed_email_domains: newDomains,
                          updated_at: new Date().toISOString(),
                        }),
                      }
                    );

                    // Update cached companies
                    const cachedCompStr = getStorageItem(CACHE_KEY_COMPANIES);
                    if (cachedCompStr) {
                      try {
                        const compList: Company[] = JSON.parse(cachedCompStr);
                        const cIdx = compList.findIndex((c) => c.id === resolvedCompanyId);
                        if (cIdx >= 0) {
                          compList[cIdx].allowedEmailDomains = newDomains;
                          setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(compList));
                        }
                      } catch {}
                    }
                  }
                }
              }
            } catch (cErr) {
              console.warn("[AdminService] Failed to append email to company allowed_email_domains on approve:", cErr);
            }
          }
        }
      } catch (err) {
        console.warn("[AdminService] Supabase fallback approve failed:", err);
      }
    }

    // Update local cache
    const cachedRequestsStr = getStorageItem(CACHE_KEY_REQUESTS);
    if (cachedRequestsStr) {
      const requests: PendingAccessRequest[] = JSON.parse(cachedRequestsStr);
      const updatedRequests = requests.filter((r) => r.id !== requestId);
      setStorageItem(CACHE_KEY_REQUESTS, JSON.stringify(updatedRequests));
    }

    if (approvedUser) {
      const cachedMembersStr = getStorageItem(CACHE_KEY_MEMBERS);
      if (cachedMembersStr) {
        const members: User[] = JSON.parse(cachedMembersStr);
        const withoutUser = members.filter((m) => m.id !== approvedUser!.id);
        withoutUser.unshift(approvedUser);
        setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(withoutUser));
      }

      return { success: true, user: approvedUser };
    }

    return { success: false, user: approvedUser };
  }

  static async rejectRequest(requestId: string): Promise<boolean> {
    const http = HttpClient.getInstance();
    try {
      await http.post(API_CONFIG.ENDPOINTS.ADMIN.REJECT_REQUEST(requestId));
    } catch {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/signup_requests?id=eq.${requestId}`, {
          method: "PATCH",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ status: "rejected", updated_at: new Date().toISOString() }),
        });
        const rows = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
        if (rows[0]?.email) {
          await fetch(
            `${API_CONFIG.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(String(rows[0].email))}`,
            {
              method: "PATCH",
              headers: {
                apikey: sbKey,
                Authorization: `Bearer ${sbKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ approval_status: "rejected", updated_at: new Date().toISOString() }),
            }
          ).catch(() => {});
        }
      } catch {}
    }

    const cached = getStorageItem(CACHE_KEY_REQUESTS);
    if (cached) {
      const requests: PendingAccessRequest[] = JSON.parse(cached);
      const filtered = requests.filter((r) => r.id !== requestId);
      setStorageItem(CACHE_KEY_REQUESTS, JSON.stringify(filtered));
    }
    const cachedMembers = getStorageItem(CACHE_KEY_MEMBERS);
    if (cachedMembers) {
      const members: User[] = JSON.parse(cachedMembers);
      const filtered = members.filter((m) => m.id !== requestId);
      setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(filtered));
    }
    return true;
  }

  /**
   * Accounts & Members (Approved users only)
   */
  static async listMembers(filterCompanyName?: string, filterCompanyId?: string): Promise<User[]> {
    let membersList: User[] = [];
    const http = HttpClient.getInstance();

    try {
      const companies = await this.listCompanies();
      const res = await http.get<any>(API_CONFIG.ENDPOINTS.ADMIN.MEMBERS);
      const data = res?.data || (Array.isArray(res) ? res : null);
      if (Array.isArray(data)) {
        const cleanData = data.filter((m) => !isMockId(m.id));
        const mappedUsers: User[] = cleanData
          .map((p) => {
            const compId = p.companyId || p.company_id;
            const comp = compId
              ? companies.find((c) => c.id.toLowerCase() === compId.toLowerCase())
              : null;
            const compName =
              comp?.name ||
              p.companyName ||
              p.company_name ||
              p.requestedCompany ||
              p.requested_company ||
              null;
            return mapProfileToUser(p, compName || undefined);
          })
          .filter((m) => m.status === "active");

        setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(mappedUsers));
        membersList = mappedUsers;
      }
    } catch {
      console.log("[AdminService] Failed to fetch members, falling back to Supabase / cache.");
    }

    if (membersList.length === 0) {
      // Direct Supabase REST fallback: only query approved profiles
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const res = await fetch(
          `${API_CONFIG.SUPABASE_URL}/rest/v1/profiles?approval_status=eq.approved&order=created_at.desc`,
          {
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
            },
          }
        );
        if (res.ok) {
          const rows = (await res.json()) as Array<Record<string, unknown>>;
          if (Array.isArray(rows) && rows.length > 0) {
            const companies = await this.listCompanies();
            const cleanRows = rows.filter((m) => !isMockId(String(m.id)));
            const mappedUsers: User[] = cleanRows
              .map((p) => {
                const compId = (p.companyId || p.company_id) as string | undefined;
                const comp = compId
                  ? companies.find((c) => c.id.toLowerCase() === compId.toLowerCase())
                  : null;
                const compName =
                  (comp?.name ||
                    p.companyName ||
                    p.company_name ||
                    p.requestedCompany ||
                    p.requested_company ||
                    null) as string | null;
                return mapProfileToUser(p, compName || undefined);
              })
              .filter((m) => m.status === "active");

            setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(mappedUsers));
            membersList = mappedUsers;
          }
        }
      } catch (err) {
        console.warn("[AdminService] Supabase fallback for members failed:", err);
      }
    }

    if (membersList.length === 0) {
      const cached = getStorageItem(CACHE_KEY_MEMBERS);
      const list: any[] = cached ? JSON.parse(cached) : [];
      const filtered = list.filter((m) => !isMockId(m.id));
      const companies = await this.listCompanies();
      const mapped = filtered.map((p) => {
        const compId = p.companyId || p.company_id;
        const comp = compId
          ? companies.find((c) => c.id.toLowerCase() === compId.toLowerCase())
          : null;
        const compName =
          comp?.name ||
          p.companyName ||
          p.company_name ||
          p.requestedCompany ||
          p.requested_company ||
          null;
        return mapProfileToUser(p, compName || undefined);
      });
      // Strict filter: only active approved members
      membersList = mapped.filter((m) => m.status === "active");
    }

    if (filterCompanyName && filterCompanyName !== "all") {
      const companies = await this.listCompanies();
      return membersList.filter((m) => {
        const compId = m.companyId?.toLowerCase();
        const mCompName =
          m.companyName ||
          (compId ? companies.find((c) => c.id.toLowerCase() === compId)?.name : null) ||
          m.requestedCompany;
        return this.matchesCompany(
          mCompName,
          filterCompanyName,
          filterCompanyId || m.companyId || undefined,
          companies
        );
      });
    }

    return membersList;
  }

  static async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const http = HttpClient.getInstance();
    try {
      await http.patch(API_CONFIG.ENDPOINTS.ADMIN.UPDATE_ROLE(userId), { role: newRole });
    } catch {}

    const cached = getStorageItem(CACHE_KEY_MEMBERS);
    if (cached) {
      const members: User[] = JSON.parse(cached);
      const updated = members.map((m) => (m.id === userId ? { ...m, role: newRole } : m));
      setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(updated));
    }
    return true;
  }

  static async moveUserCompany(
    userId: string,
    companyId: string,
    companyName: string
  ): Promise<boolean> {
    const http = HttpClient.getInstance();
    try {
      await http.patch(API_CONFIG.ENDPOINTS.ADMIN.MOVE_COMPANY(userId), { companyId });
    } catch {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const headers = {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        };
        // 1. Update profile's company_id
        const pRes = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            company_id: companyId,
            updated_at: new Date().toISOString(),
          }),
        });
        const pRows = (await pRes.json().catch(() => [])) as Array<Record<string, unknown>>;
        const userEmail = pRows[0]?.email ? String(pRows[0].email).trim().toLowerCase() : null;

        // 2. Append email to new company's allowed_email_domains
        if (userEmail && companyId) {
          const compRes = await fetch(
            `${API_CONFIG.SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`,
            { headers }
          );
          if (compRes.ok) {
            const compRows = (await compRes.json().catch(() => [])) as Array<Record<string, unknown>>;
            if (compRows[0]) {
              const currentDomains = Array.isArray(compRows[0].allowed_email_domains)
                ? (compRows[0].allowed_email_domains as string[])
                : [];
              if (!currentDomains.some((d: string) => d.toLowerCase() === userEmail)) {
                const newDomains = [...currentDomains, userEmail];
                await fetch(
                  `${API_CONFIG.SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`,
                  {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                      allowed_email_domains: newDomains,
                      updated_at: new Date().toISOString(),
                    }),
                  }
                );

                // Update cached companies
                const cachedCompStr = getStorageItem(CACHE_KEY_COMPANIES);
                if (cachedCompStr) {
                  try {
                    const compList: Company[] = JSON.parse(cachedCompStr);
                    const cIdx = compList.findIndex((c) => c.id === companyId);
                    if (cIdx >= 0) {
                      compList[cIdx].allowedEmailDomains = newDomains;
                      setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(compList));
                    }
                  } catch {}
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("[AdminService] Supabase fallback moveUserCompany failed:", err);
      }
    }

    const cached = getStorageItem(CACHE_KEY_MEMBERS);
    if (cached) {
      const members: User[] = JSON.parse(cached);
      const updated = members.map((m) =>
        m.id === userId ? { ...m, companyId, companyName } : m
      );
      setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(updated));
    }
    return true;
  }

  static async purgeUser(userId: string): Promise<boolean> {
    const http = HttpClient.getInstance();
    try {
      await http.delete(API_CONFIG.ENDPOINTS.ADMIN.PURGE_USER(userId));
    } catch {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: "DELETE",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
          },
        });
      } catch {}
    }

    const cached = getStorageItem(CACHE_KEY_MEMBERS);
    if (cached) {
      const members: User[] = JSON.parse(cached);
      const updated = members.filter((m) => m.id !== userId);
      setStorageItem(CACHE_KEY_MEMBERS, JSON.stringify(updated));
    }
    return true;
  }

  /**
   * Companies Management & Tree
   */
  static async listCompanies(): Promise<Company[]> {
    const http = HttpClient.getInstance();
    try {
      const res = await http.get<any>(API_CONFIG.ENDPOINTS.COMPANIES.LIST);
      const data = res?.data || (Array.isArray(res) ? res : null);
      if (Array.isArray(data)) {
        const cleanData = data.filter((c) => !isMockId(c.id));
        const cached = getStorageItem(CACHE_KEY_COMPANIES);
        if (cached) {
          try {
            const cachedList: Company[] = JSON.parse(cached);
            const cachedMap = new Map(cachedList.map((c) => [c.id.toLowerCase(), c]));
            const merged = cleanData.map((c) => {
              const prev = cachedMap.get(c.id.toLowerCase());
              return {
                ...c,
                memberCount: c.memberCount ?? prev?.memberCount ?? 0,
                visitCount: c.visitCount ?? prev?.visitCount ?? 0,
              };
            });
            setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(merged));
            return merged;
          } catch {}
        }
        setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(cleanData));
        return cleanData;
      }
    } catch {}

    // Direct Supabase REST fallback for companies
    try {
      const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
      const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/companies?select=*&order=name.asc`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
      });
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: Company[] = rows.map((c) => ({
            id: String(c.id),
            name: String(c.name || ""),
            parentId: typeof c.parent_id === "string" ? c.parent_id : null,
            allowedEmailDomains: Array.isArray(c.allowed_email_domains) ? (c.allowed_email_domains as string[]) : [],
            isActive: typeof c.is_active === "boolean" ? c.is_active : true,
            createdAt: typeof c.created_at === "string" ? c.created_at : new Date().toISOString(),
            updatedAt: typeof c.updated_at === "string" ? c.updated_at : new Date().toISOString(),
          }));
          setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (err) {
      console.warn("[AdminService] Supabase fallback for companies failed:", err);
    }

    const cached = getStorageItem(CACHE_KEY_COMPANIES);
    if (cached) {
      const list: Company[] = JSON.parse(cached);
      return list.filter((c) => !isMockId(c.id));
    }
    return [];
  }

  /**
   * Visits Listing with Supabase REST and Local Cache Fallback
   */
  static async listVisits(): Promise<any[]> {
    let visits: any[] = [];
    const http = HttpClient.getInstance();

    try {
      const res = await http.get<any>(API_CONFIG.ENDPOINTS.VISITS.LIST);
      const data = res?.data || (Array.isArray(res) ? res : null);
      if (Array.isArray(data) && data.length > 0) {
        visits = data.filter((v) => !isMockId(v.id));
        setStorageItem(CACHE_KEY_VISITS, JSON.stringify(visits));
        return visits;
      }
    } catch {
      console.log("[AdminService] Failed to fetch visits via API, falling back to Supabase / cache.");
    }

    // Direct Supabase REST fallback
    try {
      const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
      const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/visits?select=*&order=created_at.desc`, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      });
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        if (Array.isArray(rows) && rows.length > 0) {
          const cleanRows = rows.filter((v) => !isMockId(String(v.id)));
          visits = cleanRows.map((v) => ({
            id: String(v.id),
            siteName: String(v.site_name || v.siteName || ""),
            companyId: (v.company_id || v.companyId || null) as string | null,
            companyName: (v.company_name || v.companyName || null) as string | null,
            ownerId: (v.owner_id || v.ownerId || null) as string | null,
            status: String(v.status || "draft"),
            completedFields: Number(v.completed_fields ?? v.completedFields ?? 0),
            totalFields: Number(v.total_fields ?? v.totalFields ?? 67),
            completionPercentage: Number(v.completion_percentage ?? v.completionPercentage ?? 0),
            createdAt: String(v.created_at || v.createdAt || new Date().toISOString()),
            updatedAt: String(v.updated_at || v.updatedAt || new Date().toISOString()),
          }));
          setStorageItem(CACHE_KEY_VISITS, JSON.stringify(visits));
          return visits;
        }
      }
    } catch (err) {
      console.warn("[AdminService] Supabase fallback for visits failed:", err);
    }

    // Cache fallback
    const cached = getStorageItem(CACHE_KEY_VISITS);
    if (cached) {
      try {
        const list: any[] = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          return list.filter((v) => !isMockId(v.id));
        }
      } catch {}
    }

    // Cache fallback from submissions if present
    const cachedSubs = getStorageItem("@ecpower_admin_site_submissions_v2");
    if (cachedSubs) {
      try {
        const subs: any[] = JSON.parse(cachedSubs);
        if (Array.isArray(subs) && subs.length > 0) {
          return subs.filter((s) => !isMockId(s.id)).map((s) => ({
            id: s.id,
            siteName: s.siteName,
            companyId: s.customerId || null,
            companyName: s.customer || null,
            status: s.status || "draft",
            createdAt: s.sentAt || s.createdAt || new Date().toISOString(),
            updatedAt: s.closedAt || s.updatedAt || new Date().toISOString(),
          }));
        }
      } catch {}
    }

    return [];
  }

  static async listCompaniesWithCounts(): Promise<Company[]> {
    const [companies, members, visits] = await Promise.all([
      this.listCompanies(),
      this.listMembers().catch(() => []),
      this.listVisits().catch(() => []),
    ]);

    const enriched = companies.map((comp) => {
      const compId = comp.id.toLowerCase();
      const compName = comp.name.trim().toLowerCase();

      const memberCount = members.filter((m) => {
        // Priority 1: If member has an assigned companyId, match ONLY by companyId
        if (m.companyId) {
          return m.companyId.toLowerCase() === compId;
        }
        // Priority 2: Fall back to exact name matching only if member has no companyId
        if (m.companyName && m.companyName.trim().toLowerCase() === compName) return true;
        if (m.requestedCompany && m.requestedCompany.trim().toLowerCase() === compName) return true;
        return this.matchesCompany(m.companyName || m.requestedCompany, comp.name, comp.id, companies);
      }).length;

      const visitCount = visits.filter((v: any) => {
        // Priority 1: If visit has an assigned companyId, match ONLY by companyId
        if (v.companyId) {
          return String(v.companyId).toLowerCase() === compId;
        }
        if (v.companyName && v.companyName.trim().toLowerCase() === compName) return true;
        return this.matchesCompany(v.companyName, comp.name, comp.id, companies);
      }).length;

      return {
        ...comp,
        memberCount,
        visitCount,
      };
    });

    setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(enriched));
    return enriched;
  }

  static async createCompany(input: CreateCompanyInput): Promise<Company> {
    const http = HttpClient.getInstance();
    let created: Company | null = null;

    try {
      const res = await http.post<any>(API_CONFIG.ENDPOINTS.COMPANIES.CREATE, input);
      const data = res?.data || res;
      if (data && (data.id || data.name)) {
        created = {
          id: String(data.id),
          name: String(data.name || input.name),
          parentId: typeof data.parentId === "string" ? data.parentId : typeof data.parent_id === "string" ? data.parent_id : input.parentId || null,
          allowedEmailDomains: Array.isArray(data.allowedEmailDomains) ? data.allowedEmailDomains : Array.isArray(data.allowed_email_domains) ? data.allowed_email_domains : input.allowedEmailDomains || [],
          isActive: typeof data.isActive === "boolean" ? data.isActive : typeof data.is_active === "boolean" ? data.is_active : true,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : typeof data.created_at === "string" ? data.created_at : new Date().toISOString(),
          updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("[AdminService] createCompany API call failed, falling back to Supabase/cache:", err);
    }

    // Direct Supabase REST fallback
    if (!created) {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`;
        const newRow = {
          id: newId,
          name: input.name.trim(),
          parent_id: input.parentId || null,
          allowed_email_domains: input.allowedEmailDomains || [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/companies`, {
          method: "POST",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(newRow),
        });

        if (res.ok) {
          const rows = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
          const c = rows[0] || newRow;
          created = {
            id: String(c.id),
            name: String(c.name || input.name),
            parentId: typeof c.parent_id === "string" ? c.parent_id : input.parentId || null,
            allowedEmailDomains: Array.isArray(c.allowed_email_domains) ? (c.allowed_email_domains as string[]) : input.allowedEmailDomains || [],
            isActive: typeof c.is_active === "boolean" ? c.is_active : true,
            createdAt: typeof c.created_at === "string" ? c.created_at : new Date().toISOString(),
            updatedAt: typeof c.updated_at === "string" ? c.updated_at : new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn("[AdminService] Supabase fallback createCompany failed:", err);
      }
    }

    // Local fallback if network failed
    if (!created) {
      created = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`,
        name: input.name.trim(),
        parentId: input.parentId || null,
        allowedEmailDomains: input.allowedEmailDomains || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const cached = getStorageItem(CACHE_KEY_COMPANIES);
    if (cached) {
      try {
        const list: Company[] = JSON.parse(cached);
        const withoutOld = list.filter((c) => c.id !== created!.id);
        withoutOld.push(created);
        setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(withoutOld));
      } catch {
        setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify([created]));
      }
    } else {
      setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify([created]));
    }
    return created;
  }

  static async updateCompany(id: string, input: UpdateCompanyInput): Promise<Company | null> {
    const http = HttpClient.getInstance();
    let updated: Company | null = null;
    try {
      const res = await http.patch<any>(API_CONFIG.ENDPOINTS.COMPANIES.UPDATE(id), input);
      if (res?.data) updated = res.data;
    } catch {}

    if (!updated) {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const updateBody: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (input.name) updateBody.name = input.name.trim();
        if (input.parentId !== undefined) updateBody.parent_id = input.parentId;
        if (input.allowedEmailDomains) updateBody.allowed_email_domains = input.allowedEmailDomains;

        const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
          method: "PATCH",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(updateBody),
        });

        if (res.ok) {
          const rows = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
          if (rows[0]) {
            const r = rows[0];
            updated = {
              id: String(r.id),
              name: String(r.name || ""),
              parentId: typeof r.parent_id === "string" ? r.parent_id : null,
              allowedEmailDomains: Array.isArray(r.allowed_email_domains) ? (r.allowed_email_domains as string[]) : [],
              isActive: typeof r.is_active === "boolean" ? r.is_active : true,
              createdAt: typeof r.created_at === "string" ? r.created_at : new Date().toISOString(),
              updatedAt: typeof r.updated_at === "string" ? r.updated_at : new Date().toISOString(),
            };
          }
        }
      } catch {}
    }

    const cached = getStorageItem(CACHE_KEY_COMPANIES);
    if (cached) {
      const list: Company[] = JSON.parse(cached);
      const index = list.findIndex((c) => c.id === id);
      if (index >= 0) {
        list[index] = updated || {
          ...list[index],
          ...input,
          updatedAt: new Date().toISOString().split("T")[0],
        };
        setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(list));
        return list[index];
      }
    }
    return updated;
  }

  static async deleteCompany(id: string): Promise<boolean> {
    const http = HttpClient.getInstance();
    try {
      await http.delete(API_CONFIG.ENDPOINTS.COMPANIES.DELETE(id));
    } catch {
      try {
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
          method: "DELETE",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
          },
        });
      } catch {}
    }

    const cached = getStorageItem(CACHE_KEY_COMPANIES);
    if (cached) {
      const list: Company[] = JSON.parse(cached);
      const filtered = list.filter((c) => c.id !== id && c.parentId !== id);
      setStorageItem(CACHE_KEY_COMPANIES, JSON.stringify(filtered));
    }
    return true;
  }

  /**
   * PDF Template Sanitizer: removes section symbols only
   */
  public static sanitizeTemplate(template: PDFTemplate): PDFTemplate {
    if (!template || !Array.isArray(template.pages)) return template;

    const stripSection = (s?: string) =>
      s
        ? s
            .replace(/§\s*/g, "")
            .replace(/\u00a7\s*/g, "")
            .replace(/&sect;\s*/g, "")
            .trim()
        : "";

    const sanitizedPages = template.pages
      .map((p) => {
        const title = stripSection(p.title);
        const elements = p.elements || [];

        const sanitizedElements = elements.map((el) => ({
          ...el,
          label: stripSection(el.label),
          content: stripSection(el.content),
          placeholder: stripSection(el.placeholder),
        }));

        return {
          ...p,
          title,
          elements: sanitizedElements,
        };
      })
      .filter((p) => p.elements && p.elements.length > 0);

    return {
      ...template,
      pages: sanitizedPages,
    };
  }

  /**
   * PDF Template Fetching & Editing
   */
  static async getTemplate(): Promise<PDFTemplate> {
    return (await this.getTemplateForEditing()).template;
  }

  static async getTemplateForEditing(): Promise<{ template: PDFTemplate; unpublishedDraft: boolean }> {
    const cached = getStorageItem(CACHE_KEY_TEMPLATE);
    let local: PDFTemplate | null = null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          local = this.sanitizeTemplate(parsed);
        }
      } catch {}
    }

    const http = HttpClient.getInstance();
    const endpointsToTry = [
      API_CONFIG.ENDPOINTS.TEMPLATES.DEFAULT,
      API_CONFIG.ENDPOINTS.TEMPLATES.FALLBACK_DEFAULT,
      API_CONFIG.ENDPOINTS.TEMPLATES.FALLBACK_ACTIVE,
      API_CONFIG.ENDPOINTS.TEMPLATES.ACTIVE,
    ];

    let serverData: any = null;
    for (const ep of endpointsToTry) {
      try {
        const res = await http.get<any>(ep, { requiresAuth: false });
        const resAny = res as any;
        const candidate = resAny?.data || (resAny?.pages ? resAny : null);
        if (candidate && Array.isArray(candidate.pages) && candidate.pages.length > 0) {
          serverData = candidate;
          break;
        }
      } catch {}
    }

    if (serverData) {
      const server = this.sanitizeTemplate(serverData);
      if (serverData.isCustom || !local) {
        setStorageItem(CACHE_KEY_TEMPLATE, JSON.stringify(server));
        return { template: server, unpublishedDraft: false };
      }
      const differs = JSON.stringify(local.pages) !== JSON.stringify(server.pages);
      return differs
        ? { template: local, unpublishedDraft: true }
        : { template: server, unpublishedDraft: false };
    }

    if (local) {
      return { template: local, unpublishedDraft: false };
    }

    setStorageItem(CACHE_KEY_TEMPLATE, JSON.stringify(DEFAULT_EC_POWER_PDF_TEMPLATE));
    return { template: DEFAULT_EC_POWER_PDF_TEMPLATE, unpublishedDraft: false };
  }

  static async saveTemplate(template: PDFTemplate): Promise<PDFTemplate> {
    const sanitized = this.sanitizeTemplate(template);
    const toSave: PDFTemplate = {
      ...sanitized,
      updatedAt: new Date().toISOString().split("T")[0],
      isDefault: true,
    };

    setStorageItem(CACHE_KEY_TEMPLATE, JSON.stringify(toSave));

    const http = HttpClient.getInstance();
    const endpointsToTry = [
      API_CONFIG.ENDPOINTS.TEMPLATES.SAVE,
      API_CONFIG.ENDPOINTS.TEMPLATES.FALLBACK_SAVE,
    ];

    for (const ep of endpointsToTry) {
      try {
        const res = await http.post<any>(ep, {
          ...toSave,
          isDefault: true,
        });
        const resAny = res as any;
        if (resAny?.data?.id || resAny?.id) {
          const finalSaved: PDFTemplate = {
            ...toSave,
            id: resAny?.data?.id ?? resAny?.id ?? toSave.id,
            name: resAny?.data?.name ?? resAny?.name ?? toSave.name,
          };
          setStorageItem(CACHE_KEY_TEMPLATE, JSON.stringify(finalSaved));
          return finalSaved;
        }
      } catch {}
    }

    return toSave;
  }

  static async previewTemplateHtml(template: PDFTemplate): Promise<string> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const query = tz ? `?tz=${encodeURIComponent(tz)}` : "";

    const endpointsToTry = [
      `${API_CONFIG.ENDPOINTS.TEMPLATES.PREVIEW}${query}`,
      `${API_CONFIG.ENDPOINTS.TEMPLATES.FALLBACK_PREVIEW}${query}`,
    ];

    const http = HttpClient.getInstance();
    for (const ep of endpointsToTry) {
      try {
        const res = await http.post<any>(ep, template);
        const resAny = res as any;
        const html = resAny?.data?.html || resAny?.html;
        if (html) return html;
      } catch {}
    }

    return "";
  }

  static async resetTemplate(): Promise<PDFTemplate> {
    const endpointsToTry = [
      API_CONFIG.ENDPOINTS.TEMPLATES.DEFAULT,
      API_CONFIG.ENDPOINTS.TEMPLATES.FALLBACK_DEFAULT,
      API_CONFIG.ENDPOINTS.TEMPLATES.FALLBACK_ACTIVE,
    ];

    const http = HttpClient.getInstance();
    for (const ep of endpointsToTry) {
      try {
        const res = await http.get<any>(ep, { requiresAuth: false });
        const resAny = res as any;
        const serverData = resAny?.data || (resAny?.pages ? resAny : null);
        if (serverData && Array.isArray(serverData.pages) && serverData.pages.length > 0) {
          const server = this.sanitizeTemplate(serverData);
          setStorageItem(CACHE_KEY_TEMPLATE, JSON.stringify(server));
          return server;
        }
      } catch {}
    }

    setStorageItem(CACHE_KEY_TEMPLATE, JSON.stringify(DEFAULT_EC_POWER_PDF_TEMPLATE));
    return DEFAULT_EC_POWER_PDF_TEMPLATE;
  }

  /**
   * Metrics and Summary
   */
  static async getDashboardMetrics(
    userCompany?: string | null,
    userCompanyId?: string | null,
    isSuper = false,
    companiesList?: Company[]
  ): Promise<AdminDashboardMetrics> {
    const http = HttpClient.getInstance();
    const [requests, members, companies, visits] = await Promise.all([
      this.listPendingRequests(
        isSuper ? undefined : userCompany || undefined,
        isSuper ? undefined : userCompanyId || undefined,
        companiesList
      ),
      this.listMembers(
        isSuper ? undefined : userCompany || undefined,
        isSuper ? undefined : userCompanyId || undefined
      ),
      this.listCompaniesWithCounts(),
      this.listVisits().catch(() => []),
    ]);

    const totalVisitsCount = companies.reduce((acc, c) => acc + (c.visitCount || 0), 0);
    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const retentionWarningCount = visits.filter((v) => {
      const created = new Date(v.createdAt);
      if (isNaN(created.getTime())) return false;
      const ageInDays = Math.floor((now - created.getTime()) / MS_PER_DAY);
      return ageInDays >= 335;
    }).length;

    return {
      pendingRequestsCount: requests.length,
      totalMembersCount: members.length,
      totalCompaniesCount: isSuper ? companies.length : (userCompany ? 1 : companies.length),
      totalVisitsCount: totalVisitsCount > 0 ? totalVisitsCount : visits.length,
      retentionWarningCount,
    };
  }

  /**
   * Retention & Storage Health Metrics
   */
  static async getRetentionStorageMetrics(olderThanDays = 365): Promise<RetentionStorageMetrics> {
    const http = HttpClient.getInstance();
    const [rawVisits, companies] = await Promise.all([
      this.listVisits().catch(() => []),
      this.listCompanies().catch(() => []),
    ]);

    const visits: any[] = rawVisits.filter((v) => !isMockId(v.id));
    const companyMap = new Map(companies.map((c) => [c.id.toLowerCase(), c.name]));

    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    let expiringIn30Days = 0;
    let pastRetentionDays = 0;
    let activeVisits = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;
    const expiringVisits: ExpiringVisitItem[] = [];

    for (const v of visits) {
      const created = new Date(v.createdAt);
      if (!isNaN(created.getTime())) {
        if (!oldestDate || created < oldestDate) oldestDate = created;
        if (!newestDate || created > newestDate) newestDate = created;

        const ageInDays = Math.max(0, Math.floor((now - created.getTime()) / MS_PER_DAY));
        const daysRemaining = olderThanDays - ageInDays;
        const isExpired = ageInDays >= olderThanDays;
        const isExpiringSoon = !isExpired && daysRemaining <= 30;

        if (isExpired) {
          pastRetentionDays++;
        } else if (isExpiringSoon) {
          expiringIn30Days++;
        } else {
          activeVisits++;
        }

        if (isExpired || isExpiringSoon) {
          expiringVisits.push({
            id: v.id,
            siteName: v.siteName || "Unnamed Inspection",
            companyId: v.companyId,
            companyName:
              v.companyName ||
              (v.companyId ? companyMap.get(v.companyId.toLowerCase()) : null) ||
              "Unassigned",
            createdAt: v.createdAt,
            ageInDays,
            daysRemaining: Math.max(0, daysRemaining),
            isExpired,
            status: v.status || "completed",
          });
        }
      } else {
        activeVisits++;
      }
    }

    expiringVisits.sort((a, b) => {
      if (a.isExpired && !b.isExpired) return -1;
      if (!a.isExpired && b.isExpired) return 1;
      return a.daysRemaining - b.daysRemaining;
    });

    let totalMediaCount = 0;
    let totalPhotosCount = 0;
    let totalVideosCount = 0;
    let totalBytes = 0;

    const mediaPromises = visits.slice(0, 50).map(async (v) => {
      try {
        const res = await http.get<any>(API_CONFIG.ENDPOINTS.MEDIA.LIST(v.id));
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          return { visitId: v.id, media: list };
        }
      } catch {}
      return { visitId: v.id, media: [] };
    });

    const mediaResults = await Promise.all(mediaPromises);
    const mediaCountByVisit = new Map<string, number>();

    for (const item of mediaResults) {
      mediaCountByVisit.set(item.visitId, item.media.length);
      totalMediaCount += item.media.length;
      for (const m of item.media) {
        if (m.type === "video") totalVideosCount++;
        else totalPhotosCount++;
        if (m.fileSize) totalBytes += Number(m.fileSize);
        else totalBytes += m.type === "video" ? 15 * 1024 * 1024 : 2 * 1024 * 1024;
      }
    }

    for (const ev of expiringVisits) {
      ev.mediaCount = mediaCountByVisit.get(ev.id) ?? 0;
    }

    const estimatedStorageMB = Number((totalBytes / (1024 * 1024)).toFixed(1));

    let lastCleanup: RetentionCleanupResult | null = null;
    const cachedRun = getStorageItem(CACHE_KEY_RETENTION_RUN);
    if (cachedRun) {
      try {
        lastCleanup = JSON.parse(cachedRun);
      } catch {}
    }

    return {
      totalVisits: visits.length,
      expiringIn30Days,
      pastRetentionDays,
      activeVisits,
      retentionPeriodDays: olderThanDays,
      totalMediaCount,
      totalPhotosCount,
      totalVideosCount,
      estimatedStorageMB,
      oldestVisitDate: oldestDate ? oldestDate.toISOString() : null,
      newestVisitDate: newestDate ? newestDate.toISOString() : null,
      expiringVisits,
      lastCleanup,
    };
  }

  static async runRetentionCleanup(olderThanDays = 365): Promise<RetentionCleanupResult> {
    const http = HttpClient.getInstance();
    let purgedVisits = 0;
    let deletedFilesCount = 0;
    let freedSpaceMB = 0;

    try {
      const res = await http.post<any>(
        `${API_CONFIG.ENDPOINTS.ADMIN.RETENTION_CLEANUP}?olderThanDays=${olderThanDays}`
      );
      const data = res?.data || res || {};
      purgedVisits = Number(data.deletedVisitsCount ?? data.purgedVisitsCount ?? data.purgedVisits ?? 0);
      deletedFilesCount = Number(data.deletedFilesCount ?? data.deletedFiles ?? 0);
      freedSpaceMB = Number(data.freedSpaceMB ?? (deletedFilesCount * 2.5).toFixed(1));
    } catch (err: any) {
      console.warn("[AdminService] Retention cleanup call failed:", err);
    }

    const runResult: RetentionCleanupResult = {
      purgedVisits,
      deletedFilesCount,
      freedSpaceMB,
      timestamp: new Date().toISOString(),
    };

    setStorageItem(CACHE_KEY_RETENTION_RUN, JSON.stringify(runResult));
    return runResult;
  }
}
