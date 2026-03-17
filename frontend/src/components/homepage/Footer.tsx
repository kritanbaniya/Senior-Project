/**
 * This file defines the Footer component, which displays the footer section of the homepage.
 * The footer includes links to the Privacy Policy, Terms of Service, and Support pages, as well as a copyright notice.
 */

import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full">
      <div className="mx-auto flex max-w-[766px] flex-col items-center gap-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 text-[20px] font-normal leading-10 text-slate-700/50 md:text-[30px]">
          <span className="cursor-pointer transition hover:text-slate-700/70">
            Privacy Policy
          </span>
          <span className="cursor-pointer transition hover:text-slate-700/70">
            Terms of Service
          </span>
          <Link 
            to="/support" 
            className="cursor-pointer transition hover:text-slate-700/70"
          >
            Support
          </Link>
        </div>

        <p className="text-center text-[20px] font-normal leading-10 text-slate-700/50 md:text-[30px]">
          Digital Worms © 2026
        </p>
      </div>
    </footer>
  );
}