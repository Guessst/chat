import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export default function Page({insertAtCursor}: {insertAtCursor: (emoji: string) => void}) {

const [isOpen, setIsOpen] = React.useState(false);

return (<Popover onOpenChange={setIsOpen} open={isOpen}>
    <PopoverTrigger asChild>
        <Button>Open emoji picker</Button>
    </PopoverTrigger>
    <PopoverContent className="w-fit p-0">
        <EmojiPicker
        className="h-[342px]"
        onEmojiSelect={({ emoji }) => {
            setIsOpen(false);
            insertAtCursor(emoji);
        }}
        >
        <EmojiPickerSearch />
        <EmojiPickerContent />
        <EmojiPickerFooter />
        </EmojiPicker>
    </PopoverContent>
</Popover>)

}
