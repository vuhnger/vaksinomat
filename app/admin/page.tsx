import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-semibold text-lg">Vaksinomat</span>
            <span className="text-muted-foreground text-sm">– Legepanel</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gjennomgangskø</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Legepanel aktiveres igjen når konsultasjoner lagres permanent
            </p>
          </div>
          <Badge variant="secondary">Midlertidig av</Badge>
        </div>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">Ingen vedvarende lagring i denne deployen</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Konsultasjoner beregnes direkte og vises i nettleseren, men lagres ikke i database ennå. Derfor er også gjennomgangskø og godkjenning deaktivert.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
