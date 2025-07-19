// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPanel() {
  const [carpanlar, setCarpanlar] = useState<string>("");
  const [fiyatlar, setFiyatlar] = useState<string>("");
  const [hotels, setHotels] = useState<string>("");

  useEffect(() => {
    fetch("/carpanlar.json")
      .then((res) => res.json())
      .then((data) => setCarpanlar(JSON.stringify(data, null, 2)));

    fetch("/fiyatlar.json")
      .then((res) => res.json())
      .then((data) => setFiyatlar(JSON.stringify(data, null, 2)));

    fetch("/hotels.json")
      .then((res) => res.json())
      .then((data) => setHotels(JSON.stringify(data, null, 2)));
  }, []);

  const handleSave = async (filename: string, content: string) => {
    await fetch("/api/save-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content }),
    });
    alert(`${filename} kaydedildi ✅`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-2">Çarpanlar (carpanlar.json)</h2>
          <Textarea
            className="w-full h-96 text-sm font-mono"
            value={carpanlar}
            onChange={(e) => setCarpanlar(e.target.value)}
          />
          <Button className="mt-2" onClick={() => handleSave("carpanlar.json", carpanlar)}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-2">Fiyatlar (fiyatlar.json)</h2>
          <Textarea
            className="w-full h-96 text-sm font-mono"
            value={fiyatlar}
            onChange={(e) => setFiyatlar(e.target.value)}
          />
          <Button className="mt-2" onClick={() => handleSave("fiyatlar.json", fiyatlar)}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-2">Oteller (hotels.json)</h2>
          <Textarea
            className="w-full h-96 text-sm font-mono"
            value={hotels}
            onChange={(e) => setHotels(e.target.value)}
          />
          <Button className="mt-2" onClick={() => handleSave("hotels.json", hotels)}>
            Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
