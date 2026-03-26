import { Link, useLocation } from "react-router";
import { Home, Briefcase, FileText, User, Plus } from "lucide-react";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export function BottomNav() {
  const { tr } = useI18n();
  const location = useLocation();
  const authUser = getAuthUser();

  if (!authUser) return null;

  const isActive = (path: string) => location.pathname === path;

  if (authUser.userType === "jeune") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          <Link to="/dashboard-jeune" className="flex flex-col items-center gap-1 px-3 py-2">
            <Home className={`size-5 ${isActive("/dashboard-jeune") ? "text-indigo-600" : "text-gray-600"}`} />
            <span className={`text-xs ${isActive("/dashboard-jeune") ? "text-indigo-600 font-medium" : "text-gray-600"}`}>
              {tr("Accueil", "Gida", "Gida")}
            </span>
          </Link>

          <Link to="/missions" className="flex flex-col items-center gap-1 px-3 py-2">
            <Briefcase className={`size-5 ${isActive("/missions") ? "text-indigo-600" : "text-gray-600"}`} />
            <span className={`text-xs ${isActive("/missions") ? "text-indigo-600 font-medium" : "text-gray-600"}`}>
              {tr("Missions", "Goyey", "Ayyuka")}
            </span>
          </Link>

          <Link to="/mes-candidatures" className="flex flex-col items-center gap-1 px-3 py-2">
            <FileText className={`size-5 ${isActive("/mes-candidatures") ? "text-indigo-600" : "text-gray-600"}`} />
            <span className={`text-xs ${isActive("/mes-candidatures") ? "text-indigo-600 font-medium" : "text-gray-600"}`}>
              {tr("Candidatures", "Naafaley", "Neman aiki")}
            </span>
          </Link>

          <Link to="/profile-jeune" className="flex flex-col items-center gap-1 px-3 py-2">
            <User className={`size-5 ${isActive("/profile-jeune") ? "text-indigo-600" : "text-gray-600"}`} />
            <span className={`text-xs ${isActive("/profile-jeune") ? "text-indigo-600 font-medium" : "text-gray-600"}`}>
              {tr("Profil", "Profil", "Bayani")}
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  // Entreprise
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        <Link to="/dashboard-entreprise" className="flex flex-col items-center gap-1 px-3 py-2">
          <Home className={`size-5 ${isActive("/dashboard-entreprise") ? "text-green-600" : "text-gray-600"}`} />
          <span className={`text-xs ${isActive("/dashboard-entreprise") ? "text-green-600 font-medium" : "text-gray-600"}`}>
            {tr("Accueil", "Gida", "Gida")}
          </span>
        </Link>

        <Link to="/publier-mission" className="flex flex-col items-center gap-1 px-3 py-2">
          <div className={`size-10 rounded-full flex items-center justify-center ${isActive("/publier-mission") ? "bg-green-600" : "bg-green-600"}`}>
            <Plus className="size-5 text-white" />
          </div>
        </Link>

        <Link to="/entreprise/missions?status=ouverte" className="flex flex-col items-center gap-1 px-3 py-2">
          <Briefcase className={`size-5 ${isActive("/entreprise/missions") ? "text-green-600" : "text-gray-600"}`} />
          <span className={`text-xs ${isActive("/entreprise/missions") ? "text-green-600 font-medium" : "text-gray-600"}`}>
            {tr("Missions", "Goyey", "Ayyuka")}
          </span>
        </Link>

        <Link to="/profile-entreprise" className="flex flex-col items-center gap-1 px-3 py-2">
          <User className={`size-5 ${isActive("/profile-entreprise") ? "text-green-600" : "text-gray-600"}`} />
          <span className={`text-xs ${isActive("/profile-entreprise") ? "text-green-600 font-medium" : "text-gray-600"}`}>
            {tr("Profil", "Profil", "Bayani")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
