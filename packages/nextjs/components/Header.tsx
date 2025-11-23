"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="sticky top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 shadow-md shadow-secondary px-4">
      {/* Logo */}
      <div className="navbar-start">
        <Link href="/" passHref className="flex items-center gap-2">
          <div className="flex relative w-40 h-20">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.png" />
          </div>
        </Link>
      </div>

      {/* Connect Wallet */}
      <div className="navbar-end flex gap-2">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
