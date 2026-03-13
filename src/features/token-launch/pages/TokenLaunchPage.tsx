import { useState, useCallback } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { ConnectWalletPrompt } from "@/shared/components/ConnectWalletPrompt";
import { Card } from "@/shared/components/ui/Card";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StepIndicator } from "../components/StepIndicator";
import { Step1Register, generateTokenId } from "../components/Step1Register";
import { Step2Mint } from "../components/Step2Mint";
import { Step3Authorize } from "../components/Step3Authorize";
import { WizardDone } from "../components/WizardDone";

type WizardStep = 1 | 2 | 3 | "done";

export function TokenLaunchPage() {
  const { address } = useWallet();
  const [step, setStep]       = useState<WizardStep>(1);
  const [tokenId]             = useState(generateTokenId);
  const [maxSupply, setMaxSupply] = useState(0n);

  const advance = useCallback((to: WizardStep) => setStep(to), []);

  const stepIndex = step === "done" ? 3 : (step as number) - 1;

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-fade-in">
      <PageHeader
        title="Token Launch"
        description="Register a token on ARC-20, mint initial supply, and authorize the auction contract to mint at claim time."
        action={step !== "done" ? <StepIndicator current={stepIndex} /> : undefined}
      />

      {!address ? (
        <Card>
          <ConnectWalletPrompt
            title="Connect to launch a token"
            description="You need a connected wallet to register and manage tokens on token_registry.aleo."
          />
        </Card>
      ) : (
        <Card>
          {step === 1    && <Step1Register address={address} tokenId={tokenId} onDone={(ms) => { setMaxSupply(ms); advance(2); }} />}
          {step === 2    && <Step2Mint address={address} tokenId={tokenId} maxSupply={maxSupply} onDone={() => advance(3)} />}
          {step === 3    && <Step3Authorize tokenId={tokenId} onDone={() => advance("done")} />}
          {step === "done" && <WizardDone tokenId={tokenId} />}
        </Card>
      )}
    </div>
  );
}
