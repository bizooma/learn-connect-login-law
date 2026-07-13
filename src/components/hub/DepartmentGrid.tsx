import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departments } from "@/config/hub";

const DepartmentGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {departments.map((dept) => {
      const Icon = dept.icon;
      return (
        <Link key={dept.id} to={`/hub/${dept.id}`} className="group">
          <Card className="h-full transition-shadow hover:shadow-lg border-t-4" style={{ borderTopColor: "#FFDA00" }}>
            <CardHeader>
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "#213C82" }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {dept.name}
              </CardTitle>
              <CardDescription>{dept.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
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
