import { Button } from "components";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IcoCheck, IcoCopy } from "Theme/icons";

interface CopyUuidsButton {
  uuids: string[];
}
export const CopyUuidsButton: React.FC<CopyUuidsButton> = ({ uuids }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(uuids.join(" "));
    setCopied(true);
    toast.info("UUIDs copied to clipboard");
  };

  return (
    <Button
      color="plain"
      inverted
      tooltipLabel="copy all UUIDs"
      icon={copied ? <IcoCheck /> : <IcoCopy />}
      onClick={handleCopy}
      // noBorder
    />
  );
};
