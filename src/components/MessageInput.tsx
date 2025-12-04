import { Loader2, Paperclip, Send, X, Image as ImageIcon, Video, File } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState, useRef } from "react";

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (message: string) => void;
  handleMessageSend: (e: FormEvent, selectedFile?: File | null) => void;
}

type MediaType = 'image' | 'video' | 'file' | null;

const MessageInput = ({selectedUser, message, setMessage, handleMessageSend}:MessageInputProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [selectedType, setSelectedType] = useState<MediaType>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!message.trim() && !selectedFile) return;

      setIsUploading(true);
      await handleMessageSend(e, selectedFile);
      setSelectedFile(null);
      setSelectedType(null);
      setIsUploading(false);
    };

    const handleTypeSelect = (type: Exclude<MediaType, null>) => {
      setSelectedType(type);
      setShowMenu(false);
      // Trigger file input
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (selectedType === 'image' && !file.type.startsWith('image/')) return;
        if (selectedType === 'video' && !file.type.startsWith('video/')) return;
        if (selectedType === 'file' && !(file.type.startsWith('application/') || file.type.startsWith('text/') || file.type.startsWith('audio/'))) return;
        setSelectedFile(file);
      }
    };

    if(!selectedUser) return null;

    const acceptTypes = selectedType === 'image' ? 'image/*' :
                       selectedType === 'video' ? 'video/*' :
                       selectedType === 'file' ? '*/*' :
                       '';

    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border-t border-gray-700 pt-2"
      >
        {selectedFile && (
          <div className="relative w-fit">
            {selectedType === 'image' ? (
              <Image
                width={96}
                height={96}
                src={URL.createObjectURL(selectedFile)}
                alt="preview"
                className="w-24 h-24 object-cover rounded-lg border border-gray-600"
              />
            ) : selectedType === 'video' ? (
              <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
                <span className="text-xs text-white ml-1">{selectedFile.name.slice(0, 10)}...</span>
              </div>
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                <File className="w-8 h-8 text-white" />
                <span className="text-xs text-white ml-1">{selectedFile.name.slice(0, 10)}...</span>
              </div>
            )}
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-black rounded-full p-1"
              onClick={() => {
                setSelectedFile(null);
                setSelectedType(null);
              }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
            >
              <Paperclip size={18} className="text-gray-300" />
            </button>
            {showMenu && (
              <div className="absolute bottom-full mb-2 bg-gray-800 rounded-lg border border-gray-600 p-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeSelect('image')}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded"
                >
                  <ImageIcon size={20} className="text-gray-300" />
                  <span className="text-xs text-gray-300">Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSelect('video')}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded"
                >
                  <Video size={20} className="text-gray-300" />
                  <span className="text-xs text-gray-300">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSelect('file')}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded"
                >
                  <File size={20} className="text-gray-300" />
                  <span className="text-xs text-gray-300">File</span>
                </button>
              </div>
            )}
          </div>
          <input
            type="text"
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400"
            placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            disabled={(!selectedFile && !message) || isUploading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          className="hidden"
          onChange={handleFileChange}
        />
      </form>
    )
}
export default MessageInput
