import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightPanel({ insights }: { insights: string[] }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Insight Otomatis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight} className="rounded-md border bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {insight}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Insight akan muncul setelah data berhasil dibaca.</p>
        )}
      </CardContent>
    </Card>
  );
}
