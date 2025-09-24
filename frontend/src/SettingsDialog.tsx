import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { useState } from "react";
import { CHAT_LIMITS } from "./constants";

interface SettingsDialogInterface {
  currentUsername: string
  setCurrentUsername: React.Dispatch<React.SetStateAction<string>>
}

export function SettingsDialog({ currentUsername, setCurrentUsername }: SettingsDialogInterface) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-8 right-16">
      <Button className="hover:cursor-pointer p-2 shadow-none" variant="outline" asChild>
        <Settings className="w-10 h-10" onClick={() => setOpen(true)} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Overlay that blurs the page */}
        <DialogOverlay className="backdrop-blur-md bg-black/30" />

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {/* username */}
            <DialogTitle>Messages</DialogTitle>
            <label>Username</label>
            <span className="p-1">
            <input
              type="text"
              className={`text-sm w-[${CHAT_LIMITS.MAX_USERNAME_LENGTH}ch] px-2 py-1 border rounded-lg bg-white
                        focus:outline-none
                        focus:ring-2
                        ${{/* Limitar tamanho do username */ }}
                        ${currentUsername.length === 0 && "focus:ring-yellow-400"}
                        ${0 < currentUsername.length && currentUsername.length <= CHAT_LIMITS.MAX_USERNAME_LENGTH && "focus:ring-blue-400"}
                        ${currentUsername.length > CHAT_LIMITS.MAX_USERNAME_LENGTH && "focus:ring-red-400"}          
                    `}
              placeholder="Empty"
              value={currentUsername}
              onChange={(e) => setCurrentUsername(e.target.value)}
              spellCheck={false}
            />
            <br/>
            <br/>
            </span>
            <DialogTitle>Themes</DialogTitle>
            <p className="text-sm text-gray-400">Available <span className="italic">soon™</span></p>
            <br/>
            <DialogTitle>Find me @</DialogTitle>
            <div className="flex gap-4">
              <a href="https://github.com/Guessst" target="_blank" rel="noopener noreferrer">
                <img src="public/github.svg" alt="GitHub" className="w-10 h-10 hover:opacity-80 transition" />
              </a>
              <a href="https://www.linkedin.com/in/gustavo-queiroz-a4aaba215/" target="_blank" rel="noopener noreferrer">
                <img src="public/linkedin.svg" alt="LinkedIn" className="w-10 h-10 hover:opacity-80 transition" />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}