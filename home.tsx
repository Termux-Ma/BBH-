import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Share2, Loader, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ScrapedCode {
  id: string;
  url: string;
  sourceLanguage: string;
  code: string;
  fileName?: string;
  hostedUrl?: string;
  title?: string;
  createdAt: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrapedCodes, setScrapedCodes] = useState<ScrapedCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<ScrapedCode | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/codes");
      if (!res.ok) return;
      const codes = await res.json();
      if (Array.isArray(codes)) {
        setScrapedCodes(codes);
        if (codes.length > 0 && !selectedCode) {
          setSelectedCode(codes[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("দয়া করে একটি URL দিন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error("Failed to scrape");

      const data = await res.json();
      if (data.codes && Array.isArray(data.codes) && data.codes.length > 0) {
        setScrapedCodes([...data.codes, ...scrapedCodes]);
        setSelectedCode(data.codes[0]);
        setUrl("");
        toast.success(`${data.codes.length}টি কোড এক্সট্র্যাক্ট হয়েছে!`);
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error("URL এক্সট্র্যাক্ট করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (selectedCode) {
      navigator.clipboard.writeText(selectedCode.code);
      toast.success("কপি করা হয়েছে!");
    }
  };

  const handleDownload = () => {
    if (selectedCode) {
      const blob = new Blob([selectedCode.code], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = selectedCode.fileName || `code.${selectedCode.sourceLanguage}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("ডাউনলোড হয়েছে!");
    }
  };

  const handleShare = async () => {
    if (selectedCode && selectedCode.id) {
      try {
        if (selectedCode.hostedUrl) {
          navigator.clipboard.writeText(selectedCode.hostedUrl);
          toast.success("লিঙ্ক কপি করা হয়েছে!");
        } else {
          const res = await fetch(`/api/codes/${selectedCode.id}/host`, {
            method: "POST",
          });
          const data = await res.json();
          if (data.hostedUrl) {
            navigator.clipboard.writeText(data.hostedUrl);
            toast.success("হোস্ট করা হয়েছে এবং লিঙ্ক কপি হয়েছে!");
            setSelectedCode({ ...selectedCode, hostedUrl: data.hostedUrl });
          }
        }
      } catch (error) {
        toast.error("হোস্ট করতে ব্যর্থ হয়েছে");
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/codes/${id}`, { method: "DELETE" });
      setScrapedCodes(scrapedCodes.filter((c) => c.id !== id));
      if (selectedCode?.id === id) {
        const remaining = scrapedCodes.filter((c) => c.id !== id);
        setSelectedCode(remaining[0] || null);
      }
      toast.success("ডিলিট হয়েছে!");
    } catch (error) {
      toast.error("ডিলিট করতে ব্যর্থ হয়েছে");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-sm">
              &lt;/&gt;
            </div>
            <h1 className="text-2xl font-bold">
              Source <span className="text-emerald-400">Inspector</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400">Development by <span className="text-emerald-400 font-semibold">Arish Ahmed</span></p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="text-7xl text-emerald-400">&lt;/&gt;</div>
          </div>
          <h2 className="text-5xl font-bold mb-4">
            Source <span className="text-emerald-400">Inspector</span>
          </h2>
          <p className="text-slate-300 text-lg mb-2">
            এক কোনো ওয়েবসাইটের সম্পূর্ণ সোর্স কোড (HTML, CSS, JS) এক্সট্র্যাক্ট করুন
          </p>
          <p className="text-slate-500 text-sm">
            রিয়েল টাইমে যেকোনো ওয়েবসাইটের কোড দেখুন এবং ডাউনলোড করুন
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="flex gap-3">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleScrape()}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 flex-1 h-14 text-base"
              data-testid="input-url"
            />
            <Button
              onClick={handleScrape}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-14 text-base font-semibold"
              data-testid="button-scrape"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  এক্সট্র্যাক্ট হচ্ছে...
                </>
              ) : (
                <>
                  🔍 এক্সট্র্যাক্ট
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800/30 border-slate-700 p-6 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
            <h3 className="text-xl font-bold mb-2 text-emerald-400">সম্পূর্ণ এক্সট্র্যাকশন</h3>
            <p className="text-slate-400 text-sm">
              HTML, CSS, এবং JavaScript ফাইল একসাথে এক্সট্র্যাক্ট করুন।
            </p>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 p-6 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
            <h3 className="text-xl font-bold mb-2 text-emerald-400">সিটাডায় হাইলাইট</h3>
            <p className="text-slate-400 text-sm">
              রঙিন কোড ভিউ সহ সহজে পড়ুন এবং বুঝুন।
            </p>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 p-6 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
            <h3 className="text-xl font-bold mb-2 text-emerald-400">সহজ শেয়ারিং</h3>
            <p className="text-slate-400 text-sm">
              রাজিন কোড শেয়ার করুন এবং হোস্ট করুন।
            </p>
          </Card>
        </div>

        {/* Main Content */}
        {scrapedCodes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-sm font-semibold text-emerald-400">
                    এক্সট্র্যাক্ট করা ফাইলসমূহ ({scrapedCodes.length})
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {scrapedCodes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCode(item)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-700 transition-colors text-sm ${
                        selectedCode?.id === item.id
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-300 hover:bg-slate-700/50"
                      }`}
                      data-testid={`item-code-${item.id}`}
                    >
                      <div className="font-mono truncate text-xs">
                        {item.fileName || item.url}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {item.sourceLanguage}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Editor Area */}
            <div className="lg:col-span-3">
              {selectedCode ? (
                <Card className="bg-slate-800/50 border-slate-700 overflow-hidden backdrop-blur-sm">
                  <Tabs defaultValue="code" className="w-full">
                    <TabsList className="bg-slate-700/50 border-b border-slate-700 w-full justify-start rounded-none px-4">
                      <TabsTrigger
                        value="code"
                        className="text-slate-300 data-[state=active]:text-emerald-400"
                      >
                        কোড
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className="text-slate-300 data-[state=active]:text-emerald-400"
                      >
                        প্রিভিউ
                      </TabsTrigger>
                      <TabsTrigger
                        value="info"
                        className="text-slate-300 data-[state=active]:text-emerald-400"
                      >
                        তথ্য
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="code" className="p-6">
                      <div className="flex gap-2 mb-6 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10"
                          data-testid="button-copy"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          কপি
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10"
                          data-testid="button-download"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          ডাউনলোড
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10"
                          data-testid="button-share"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          শেয়ার
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(selectedCode.id)}
                          className="border-red-600/50 text-red-400 hover:bg-red-500/10"
                          data-testid="button-delete"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          মুছুন
                        </Button>
                      </div>

                      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-700 max-h-96">
                        <code className="text-xs font-mono text-emerald-300">
                          {selectedCode.code}
                        </code>
                      </pre>
                    </TabsContent>

                    <TabsContent value="preview" className="p-6">
                      {selectedCode.sourceLanguage === "html" ? (
                        <div className="border border-slate-700 rounded-lg overflow-hidden bg-white min-h-96">
                          <iframe
                            srcDoc={selectedCode.code}
                            className="w-full h-96 border-none"
                            sandbox="allow-same-origin allow-scripts allow-popups"
                          />
                        </div>
                      ) : selectedCode.sourceLanguage === "css" ? (
                        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                          <p className="text-slate-400 mb-4">CSS প্রিভিউ:</p>
                          <pre className="text-xs text-emerald-300 overflow-x-auto">
                            <code>{selectedCode.code}</code>
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 min-h-96 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-slate-400 mb-2">{selectedCode.sourceLanguage.toUpperCase()} প্রিভিউ উপলব্ধ নয়</p>
                            <p className="text-xs text-slate-500">শুধুমাত্র HTML এবং CSS কে প্রিভিউ করা যায়</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="info" className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-400 mb-1">
                            URL
                          </h4>
                          <p className="text-slate-300 text-sm break-all font-mono">
                            {selectedCode.url}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-400 mb-1">
                            ভাষা
                          </h4>
                          <p className="text-slate-300 text-sm capitalize">
                            {selectedCode.sourceLanguage}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-400 mb-1">
                            ফাইল নাম
                          </h4>
                          <p className="text-slate-300 text-sm font-mono">
                            {selectedCode.fileName}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-400 mb-1">
                            লাইন সংখ্যা
                          </h4>
                          <p className="text-slate-300 text-sm">
                            {selectedCode.code.split("\n").length}
                          </p>
                        </div>
                        {selectedCode.hostedUrl && (
                          <div>
                            <h4 className="text-sm font-semibold text-emerald-400 mb-1">
                              হোস্ট লিঙ্ক
                            </h4>
                            <p className="text-slate-300 text-sm break-all font-mono">
                              {selectedCode.hostedUrl}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-2">এখনও কোন কোড এক্সট্র্যাক্ট করা হয়নি</p>
            <p className="text-slate-500 text-sm">
              উপরে একটি ওয়েবসাইট URL দিয়ে শুরু করুন
            </p>
          </div>
        )}

        {/* Footer - Contact Owner */}
        <div className="mt-16 pt-8 border-t border-slate-700/50">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4 text-emerald-400">Contact Owner</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="https://www.facebook.com/arishahmedtushar287"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all text-slate-300 hover:text-emerald-400"
                data-testid="link-facebook"
              >
                <span>📘</span>
                <span>Facebook</span>
              </a>
              <a
                href="https://wa.me/8801922450559"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all text-slate-300 hover:text-emerald-400"
                data-testid="link-whatsapp"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
