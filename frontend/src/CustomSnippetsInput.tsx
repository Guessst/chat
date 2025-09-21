import { useState, useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Smile } from "lucide-react";

export default function CustomSnippetsInput() {
  const [value, setValue] = useState("");
  const [snippets, setSnippets] = useState([
    { name: "ascii shrug", text: "¯\\_(ツ)_/¯" },
    { name: "table flip", text: "(╯°□°）╯︵ ┻━┻" },
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.slice(0, start) + text + value.slice(end);
    setValue(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + text.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const addSnippet = () => {
    const name = prompt("Enter a name:");
    const text = prompt("Enter the text:");
    if (name && text) {
      setSnippets((prev) => [...prev, { name, text }]);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className="w-full rounded-md border p-2"
      />

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              {snippets.map((s, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className="w-full justify-start font-mono"
                  onClick={() => insertAtCursor(s.text)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={addSnippet}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
}
