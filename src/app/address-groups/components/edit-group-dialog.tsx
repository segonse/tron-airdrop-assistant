"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AddressGroup, Address } from "@/types";
import * as XLSX from "xlsx";

// 定义接口以描述 Excel 文件中的数据结构
interface ExcelData {
  address: string;
  amount?: string;
}

interface EditGroupDialogProps {
  group: AddressGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: AddressGroup) => void;
}

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
  onSave,
}: EditGroupDialogProps) {
  const [name, setName] = useState(group?.name || "");
  const [addresses, setAddresses] = useState<Address[]>(group?.addresses || []);
  const [newAddress, setNewAddress] = useState("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setAddresses(group.addresses || []);
    }
  }, [group]);

  const handleSave = () => {
    if (group && name.trim()) {
      onSave({
        ...group,
        name: name.trim(),
        addresses,
      });
      onOpenChange(false);
    }
  };

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      const address: Address = {
        group_id: group?._id || "",
        address: newAddress.trim(),
        description: newAmount.trim(),
      };
      setAddresses([...addresses, address]);
      setNewAddress("");
      setNewAmount("");
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter((addr) => addr._id !== id));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: ExcelData[] = XLSX.utils.sheet_to_json(worksheet);
        json.forEach((item: ExcelData) => {
          const address: Address = {
            group_id: group?._id || "",
            address: item.address || "",
            description: item.amount || "",
          };
          setAddresses((prev) => [...prev, address]);
        });
      } else if (file.type === "text/plain") {
        const text = new TextDecoder().decode(data);
        const lines = text.split("\n");
        lines.forEach((line) => {
          const [address, amount] = line.split(",");
          const addr: Address = {
            group_id: group?._id || "",
            address: address.trim(),
            description: amount?.trim() || "",
          };
          setAddresses((prev) => [...prev, addr]);
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">管理分组</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">基本信息</TabsTrigger>
            <TabsTrigger value="addresses">地址列表</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">分组名称</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入分组名称"
              />
            </div>
          </TabsContent>
          <TabsContent value="addresses" className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="输入地址"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="转账金额（可选）"
                    type="number"
                  />
                </div>
                <Button onClick={handleAddAddress}>添加</Button>
              </div>
              <div>
                <input
                  type="file"
                  accept=".txt, .xlsx"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-2">
                {addresses.map((addr, index) => (
                  <div
                    key={addr._id}
                    className="flex items-center justify-between rounded-lg bg-muted p-2 text-black"
                  >
                    <div className="flex-1 truncate">
                      <div className="font-medium">
                        {index + 1}. {addr.address}
                      </div>
                      {addr.description && (
                        <div className="text-sm text-muted-foreground">
                          金额: {addr.description}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAddress(addr._id || "")}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            className="bg-black text-white"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button className="bg-black text-white" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
