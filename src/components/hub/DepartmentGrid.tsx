import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departments } from "@/config/hub";
import teamPhotoAsset from "@/assets/nueva-frontera-team.jpg.asset.json";

const DepartmentGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {departments.map((dept) => {
      const Icon = dept.icon;
      const isOperations = dept.id === "operations";
      return (
        <Link key={dept.id} to={`/hub/${dept.id}`} className="group">
          <Card
            className="h-full transition-shadow hover:shadow-lg border-t-4 relative overflow-hidden"
            style={{ borderTopColor: "#FFDA00" }}
          >
            {isOperations && (
              <div
                className="absolute inset-0 bg-cover bg-bottom"
                style={{ backgroundImage: `url(${teamPhotoAsset.url})` }}
              />
            )}
            <CardHeader className="relative z-10">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "#213C82" }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle
                className={`group-hover:text-primary transition-colors ${
                  isOperations ? "text-white" : ""
                }`}
              >
                {dept.name}
              </CardTitle>
              <CardDescription className={isOperations ? "text-white/80" : ""}>
                {dept.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p
                className={`text-xs ${
                  isOperations ? "text-white/70" : "text-muted-foreground"
                }`}
              >
                {dept.tiles.length} {dept.tiles.length === 1 ? "resource" : "resources"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    })}
  </div>
);

export default DepartmentGrid;
