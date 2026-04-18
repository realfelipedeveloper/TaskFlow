type FileUploadProps = {
  files: (File | string)[];
  onChange: (files: (File | string)[]) => void;
};

export function FileUpload({ files, onChange }: FileUploadProps) {
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];

    onChange([...files, ...newFiles]);

    e.target.value = "";
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  const getFileName = (file: File | string) =>
    typeof file === "string"
    ? file.split("/").pop()
    : file.name;

  const getFileUrl = (file: File | string) =>
    typeof file === "string"
    ? `/taskflow/api${file}`
    : null;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 border border-white/10 text-white px-3 py-2 rounded">
        <span>📎</span>
        <span>Selecionar arquivos</span>

        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleAddFiles}
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div
                key={index}
                className="flex items-center justify-between bg-slate-800/40 px-2 py-1 rounded text-sm"
            >
                <div className="flex items-center gap-2 truncate">
                <span>📄</span>

                {typeof file === "string" ? (
                    <a
                    href={getFileUrl(file)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                    >
                    {getFileName(file)}
                    </a>
                ) : (
                    <span className="truncate">{file.name}</span>
                )}
                </div>

                <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-red-400 hover:text-red-600 px-2"
                >
                ✕
                </button>
            </div>
            ))}
        </div>
        )}
    </div>
  );
}
