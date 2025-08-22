import { useLanguage } from "@/app/hooks/useLanguage";
import { Label } from "@radix-ui/react-label";
import { AlertTriangle, QrCode } from "lucide-react";
import Image from "next/image";
import React, { RefObject } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../ui/LoadingSpinner";

type MfaModalProps = {
  showSetupModal: boolean;
  handleCloseModal: () => void;
  isEnrolling: boolean;
  enrollData: any;
  showQRCode: boolean;
  setShowQRCode: (show: boolean) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  isVerifyingEnroll: boolean;
  handleVerifySetup: () => void;
};

const MfaModal = ({
  showSetupModal,
  handleCloseModal,
  isEnrolling,
  enrollData,
  showQRCode,
  setShowQRCode,
  inputRef,
  verificationCode,
  setVerificationCode,
  isVerifyingEnroll,
  handleVerifySetup,
}: MfaModalProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={showSetupModal} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-500" />
            {t("mfa.modal.title")}
          </DialogTitle>
          <DialogDescription>{t("mfa.modal.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEnrolling && (
            <div className="flex justify-center py-8">
              <LoadingSpinner
                size="lg"
                variant="primary"
                showText
                text={t("mfa.modal.preparing")}
              />
            </div>
          )}

          {!isEnrolling && enrollData && (
            <div>
              {showQRCode ? (
                <>
                  <div className="flex justify-center">
                    <Image
                      src={enrollData.totp.qr_code}
                      alt="MFA QR Code"
                      width={200}
                      height={200}
                      className="border rounded-lg"
                    />
                  </div>
                  <div className="text-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRCode(false)}
                      className="text-xs"
                    >
                      {t("common.manual.entry") ||
                        "QRコードをスキャンできない場合はこちら"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t("mfa.modal.manual.key")}
                    </p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all block">
                      {enrollData.totp.secret}
                    </code>
                  </div>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRCode(true)}
                      className="text-xs"
                    >
                      {t("common.back") || "QRコードに戻る"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isEnrolling && enrollData && (
            <>
              <div className="space-y-2">
                <Label htmlFor="verification-code">
                  {t("mfa.modal.code.label")}
                </Label>
                <Input
                  ref={inputRef}
                  id="verification-code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setVerificationCode(value);
                  }}
                  placeholder={t("mfa.modal.code.placeholder")}
                  className="text-center text-lg font-mono"
                  disabled={false}
                  autoComplete="off"
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-xs text-yellow-800 dark:text-yellow-300">
                  <p className="mb-1">{t("mfa.modal.code.note")}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseModal}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleVerifySetup}
            disabled={
              isVerifyingEnroll || verificationCode.length !== 6 || !enrollData
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {isVerifyingEnroll
              ? t("mfa.modal.verifying")
              : t("mfa.modal.verify")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MfaModal;
