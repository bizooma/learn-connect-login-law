import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departments } from "@/config/hub";
import teamPhotoAsset from "@/assets/nueva-frontera-team.jpg.asset.json";
import marketingPhotoAsset from "@/assets/marketing-team.jpg.asset.json";
import peopleCulturePhotoAsset from "@/assets/people-culture-team.webp.asset.json";

const DepartmentGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {departments.map((dept) => {
      const isOperations = dept.id === "operations";
      const isMarketing = dept.id === "marketing";
      const isPeopleCulture = dept.id === "people-culture";
      const hasPhotoBackground = isOperations || isMarketing || isPeopleCulture;
      const backgroundImage = isOperations
        ? teamPhotoAsset.url
        : isMarketing
          ? marketingPhotoAsset.url
          : peopleCulturePhotoAsset.url;
      return (
        <Link key={dept.id} to={`/hub/${dept.id}`} className="group">
          <Card
            className="h-full min-h-[300px] transition-shadow hover:shadow-lg border-t-4 relative overflow-hidden"
            style={{ borderTopColor: "#FFDA00" }}
          >
            {hasPhotoBackground && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-bottom"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#213C82]/75 via-[#213C82]/30 to-transparent" />
              </>
            )}
            <CardHeader className="relative z-10">
              <CardTitle
                className={`group-hover:text-primary transition-colors ${
                  hasPhotoBackground ? "text-white" : ""
                }`}
              >
                {dept.name}
              </CardTitle>
              <CardDescription className={hasPhotoBackground ? "text-white/80" : ""}>
                {dept.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p
                className={`text-xs ${
                  hasPhotoBackground ? "text-white/70" : "text-muted-foreground"
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
