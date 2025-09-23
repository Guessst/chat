import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-8 right-16">
      <Button variant="ghost" asChild>
        <Settings className="h-16 w-16" onClick={() => setOpen(true)} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Overlay that blurs the page */}
        <DialogOverlay className="backdrop-blur-md bg-black/30" />

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Font Size</label>
              <input type="range" min={12} max={24} className="w-full" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}