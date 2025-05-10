"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadFFMPEG } from "@/lib/load-ffmpeg";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressingProgress, setCompressingProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = async () => {
    const ffmpeg = await loadFFMPEG();
    ffmpegRef.current = ffmpeg;
  };

  useEffect(() => {
    load();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Invalid file type. Please upload a video file.");
      return;
    }

    if (file.size >= 5 * 1024 * 1024) {
      alert("File size must be less than 5MB for this demo.");
      return;
    }

    setVideoFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".webm", ".mov"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const compressVideo = async () => {
    if (!ffmpegRef.current || !videoFile) {
      alert("Please upload a video file first.");
      return;
    }

    try {
      console.log("Starting compression...");
      setIsCompressing(true);
      setCompressingProgress(0);
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("progress", ({ progress }) => {
        setCompressingProgress(Math.round(progress * 100));
      });

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));

      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "fast",
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");

      if (!data || data.length === 0) {
        throw new Error(
          "No data returned from ffmpeg. Compression might have failed."
        );
      }

      const compressedBlob = new Blob([data as unknown as ArrayBuffer], {
        type: "video/mp4",
      });

      if (compressedBlob.size >= videoFile.size) {
        console.warn(
          "Compressed file size is not smaller than original. Compression might not be effective or original file was already small."
        );
      }

      const url = URL.createObjectURL(compressedBlob);
      const a = document.createElement("a");
      a.href = url;

      const originalFileName = videoFile.name.split(".").slice(0, -1).join(".");
      const originalFileExtension = videoFile.name.split(".").pop();
      a.download = `${originalFileName}_compressed.${
        originalFileExtension || "mp4"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("Video compressed and downloaded successfully!");
    } catch (error) {
      console.error("Compression failed:", error);
      alert(
        `Compression failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsCompressing(false);
      setCompressingProgress(0);
    }
  };

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Video Compressor</h1>
          <p className="text-muted-foreground">
            Compress your videos with ease in your browser. (Max 5MB for demo)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>
              Select your video file to compress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isDragActive
                  ? "Drop your video here"
                  : "Drag and drop your video here, or click to select"}
              </p>
              {videoFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected file:{" "}
                  <span className="font-medium">{videoFile.name}</span> (
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Compression Level</label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue placeholder="Select compression level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (Lower Quality)</SelectItem>
                    <SelectItem value="normal">Normal (Balanced)</SelectItem>
                    <SelectItem value="ultra">
                      Ultra (Higher Quality)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Output Format</label>
                <Select defaultValue="mp4">
                  <SelectTrigger>
                    <SelectValue placeholder="Select output format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                    <SelectItem value="mov">MOV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isCompressing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Compressing video...</span>
                  <span>{compressingProgress}%</span>
                </div>
                <Progress value={compressingProgress} className="h-2" />
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={compressVideo}
              disabled={isCompressing || !videoFile}
            >
              {isCompressing ? "Compressing..." : "Compress Video"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
