"use client";

import { TextQuote } from "lucide-react";

export function AnchorNav() {
  return (
    <div className="hidden text-sm xl:block">
      <div className="sticky top-24">
        <p className="text-sm mb-6 text-gray-500 dark:text-gray-400 flex items-center gap-3 relative after:absolute after:bottom-[-12px] after:left-0 after:w-[130px] after:h-px after:bg-gray-200 dark:after:bg-gray-800">
          <TextQuote className="h-[14px] w-[14px] opacity-50" strokeWidth={2} /> On This Page
        </p>
        <ul className="space-y-2">
          <li><a href="" className="text-sky-500 dark:text-sky-400">Components</a></li>
          <li>
            <a href="">Foundations</a>
            <ul className="pl-4 space-y-2 pt-2">
              <li><a href="">Typography</a></li>
              <li><a href="">Colors</a></li>
              <li><a href="">Icons</a></li>
            </ul>
          </li>
          <li><a href="">Sections</a></li>
        </ul>
      </div>
    </div>
  );
}