import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartment, type Tile } from "@/config/hub";
import nfilProcessImg from "@/assets/nfil-process.jpg";

const TileLink = ({ tile, children }: { tile: Tile; children: React.ReactNode }) => {
  if (tile.target.kind === "external") {
    return (
      <a href={tile.target.url} target="_blank" rel="noopener noreferrer" className="group">
        {children}
      </a>
    );
  }
  return (
    <Link to={tile.target.to} className="group">
      {children}
    </Link>
  );
};

const DepartmentDetail = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const dept = departmentId ? getDepartment(departmentId) : undefined;

  if (!dept) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Department not found.</p>
        <Button asChild variant="outline">
          <Link to="/hub">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to departments
          </Link>
        </Button>
      </div>
    );
  }

  const HeaderIcon = dept.icon;

  return (
    <div>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/hub">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All departments
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-lg flex items-center justify-center"
            style={{ background: "#213C82" }}
          >
            <HeaderIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{dept.name}</h2>
            <p className="text-muted-foreground">{dept.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dept.tiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <TileLink key={idx} tile={tile}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "#FFDA00" }}
                    >
                      <Icon className="h-5 w-5 text-black" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {tile.label}
                      </CardTitle>
                      {tile.description && (
                        <CardDescription className="mt-1">
                          {tile.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent />
              </Card>
            </TileLink>
          );
        })}
      </div>

      {departmentId === "legal" && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">The New Frontier Way</h3>
          <img
            src={nfilProcessImg}
            alt="The New Frontier Way process flowchart"
            className="w-full rounded-lg border bg-white"
          />
        </div>
      )}
    </div>
  );
};

export default DepartmentDetail;
