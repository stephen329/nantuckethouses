"use client";

import { useState } from "react";
import { Menu, X, ChevronDown, ClipboardList, Hammer, Home, MapPinned } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems, navCta } from "@/lib/navigation";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openResourceGroup, setOpenResourceGroup] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e8e8e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" onClick={() => setIsOpen(false)}>
            <Image
              src="/Nantucket Houses_Master_logo.png"
              alt="Nantucket Houses"
              width={160}
              height={42}
              priority
              className="h-10 lg:h-12 w-auto"
            />
          </Link>

          {/* Desktop: 5-pillar nav + CTA */}
          <div className="hidden lg:flex flex-1 items-center justify-end gap-1">
            {primaryNavItems.map((item) => {
              const hasDropdown = (item.children && item.children.length > 0) || item.megaMenuColumns;

              if (!hasDropdown) {
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.path
                        ? "text-[var(--privet-green)] bg-[var(--sandstone)]"
                        : "text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:bg-[var(--sandstone)]/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.key} className="relative group">
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] rounded-md hover:bg-[var(--sandstone)]/50 transition-colors">
                    {item.label}
                    <ChevronDown className="w-3 h-3 opacity-50 transition-transform group-hover:rotate-180" />
                  </button>

                  {item.megaMenuColumns ? (
                    <>
                      {/* Full-width hover bridge so cursor can reach the fixed mega without leaving the group */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-full z-[55] h-4 w-screen max-w-[100vw] -translate-x-1/2 opacity-0 invisible transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:visible"
                      />
                      <div className="pointer-events-none fixed inset-x-4 top-16 z-[60] flex justify-center pt-2 opacity-0 invisible transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:visible lg:top-20">
                        <div className="max-h-[min(80vh,calc(100vh-6rem))] w-full max-w-[1040px] min-w-0 overflow-y-auto rounded-lg border border-[#e8e8e8] bg-white p-3 shadow-lg">
                          <div
                            className="grid min-w-0 gap-4"
                            style={{
                              gridTemplateColumns: `repeat(${item.megaMenuColumns.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {item.megaMenuColumns.map((column) => (
                              <div key={column.label} className="min-w-0">
                                <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--nantucket-gray)]">
                                  {column.label}
                                </p>
                                <div className="space-y-1">
                                  {column.items.map((subItem) =>
                                    subItem.path ? (
                                      <Link
                                        key={`${column.label}-${subItem.path}-${subItem.label}`}
                                        href={subItem.path}
                                        className={`block rounded-md px-3 py-2.5 text-sm transition-colors ${
                                          pathname === subItem.path
                                            ? "bg-[var(--sandstone)] text-[var(--privet-green)]"
                                            : "text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]/60"
                                        } ${subItem.isFeatured ? "border border-[var(--privet-green)]/30" : ""}`}
                                      >
                                        <span className="font-medium">{subItem.label}</span>
                                        {subItem.badge && (
                                          <span className="ml-2 inline-flex rounded-full bg-[var(--privet-green)]/10 px-2 py-0.5 align-middle text-[10px] font-semibold text-[var(--privet-green)]">
                                            {subItem.badge}
                                          </span>
                                        )}
                                        {subItem.description && (
                                          <span className="mt-0.5 block text-xs text-[var(--nantucket-gray)]">
                                            {subItem.description}
                                          </span>
                                        )}
                                      </Link>
                                    ) : (
                                      <div
                                        key={`${column.label}-nolink-${subItem.label}`}
                                        className={`block rounded-md px-3 py-2.5 text-sm ${
                                          subItem.label.includes("Cost Calculator")
                                            ? "bg-[var(--sandstone)]/75 text-[var(--privet-green)]"
                                            : "bg-[var(--sandstone)]/40 text-[var(--atlantic-navy)]/75"
                                        }`}
                                      >
                                        <span className="font-medium">{subItem.label}</span>
                                        {subItem.badge && (
                                          <span className="ml-2 inline-flex rounded-full bg-[var(--privet-green)]/10 px-2 py-0.5 align-middle text-[10px] font-semibold text-[var(--privet-green)]">
                                            {subItem.badge}
                                          </span>
                                        )}
                                        {subItem.description && (
                                          <span className="mt-0.5 block text-xs text-[var(--nantucket-gray)]">
                                            {subItem.description}
                                          </span>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 border-t border-[#e8e8e8] pt-3">
                            <Link
                              href={item.path}
                              className="inline-flex items-center rounded-md bg-[var(--atlantic-navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--atlantic-navy)]/90"
                            >
                              Explore All Resources
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute left-0 top-full z-50 max-w-[calc(100vw-1.5rem)] pt-2 opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible">
                      <div className="min-w-[260px] w-max max-w-full rounded-lg border border-[#e8e8e8] bg-white p-3 shadow-lg">
                        {item.children?.map((subItem) =>
                          subItem.path ? (
                            <Link
                              key={subItem.path}
                              href={subItem.path}
                              className={`block rounded-md px-3 py-2.5 text-sm transition-colors ${
                                pathname === subItem.path
                                  ? "bg-[var(--sandstone)] text-[var(--privet-green)]"
                                  : "text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]/60"
                              }`}
                            >
                              <span className="font-medium">{subItem.label}</span>
                              {subItem.description && (
                                <span className="mt-0.5 block text-xs text-[var(--nantucket-gray)]">
                                  {subItem.description}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <div
                              key={`nolink-${item.key}-${subItem.label}`}
                              className="block rounded-md bg-[var(--sandstone)]/40 px-3 py-2.5 text-sm text-[var(--atlantic-navy)]/70"
                            >
                              <span className="font-medium">{subItem.label}</span>
                              {subItem.description && (
                                <span className="mt-0.5 block text-xs text-[var(--nantucket-gray)]">
                                  {subItem.description}
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* CTA */}
            <Link
              href={navCta.path}
              className="ml-2 bg-[var(--privet-green)] text-white px-5 py-2 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              {navCta.label}
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className="p-2 text-[var(--atlantic-navy)]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-[#e8e8e8] bg-white max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {primaryNavItems.map((item) => {
              const hasDropdown = (item.children && item.children.length > 0) || item.megaMenuColumns;
              if (!hasDropdown) {
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-3 text-sm font-semibold text-[var(--atlantic-navy)] border-b border-[#e8e8e8]"
                  >
                    {item.label}
                  </Link>
                );
              }

              const mobileItems = item.megaMenuColumns
                ? item.megaMenuColumns.flatMap((column) => [
                    { label: column.label, path: "", isFeatured: false } as any,
                    ...column.items,
                  ])
                : item.children ?? [];

              return (
                <div key={item.key} className="border-b border-[#e8e8e8] last:border-b-0">
                  <button
                    onClick={() => setOpenMenu(openMenu === item.key ? null : item.key)}
                    className="flex items-center justify-between w-full px-3 py-3 text-sm font-semibold text-[var(--atlantic-navy)]"
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--nantucket-gray)] transition-transform ${
                        openMenu === item.key ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openMenu === item.key && (
                    <div className="pb-2 pl-3">
                      {item.key !== "resources" && (
                        <Link
                          href={item.path}
                          onClick={() => setIsOpen(false)}
                          className="block px-3 py-2 text-sm font-semibold text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] rounded-md"
                        >
                          Explore All {item.label}
                        </Link>
                      )}
                      {item.key === "resources" && item.megaMenuColumns ? (
                        <div className="pr-2">
                          {item.megaMenuColumns.map((group) => {
                            const icon =
                              group.label === "Regulatory Updates"
                                ? ClipboardList
                                : group.label === "Zoning & Planning Tools"
                                ? MapPinned
                                : group.label === "Affordable & Workforce Housing"
                                ? Home
                                : Hammer;
                            const Icon = icon;
                            const isGroupOpen = openResourceGroup === group.label;
                            return (
                              <div key={`resources-group-${group.label}`} className="mb-1">
                                <button
                                  onClick={() =>
                                    setOpenResourceGroup(
                                      isGroupOpen ? null : group.label,
                                    )
                                  }
                                  className="w-full flex items-center justify-between px-3 py-3 rounded-md bg-[var(--sandstone)]/60 hover:bg-[var(--sandstone)] text-left"
                                >
                                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--atlantic-navy)]">
                                    <Icon className="w-4 h-4 text-[var(--privet-green)]" />
                                    {group.label}
                                  </span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-[var(--nantucket-gray)] transition-transform ${
                                      isGroupOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                                {isGroupOpen && (
                                  <div className="pt-1 pb-2 pl-4">
                                    {group.items.map((subItem) =>
                                      subItem.path ? (
                                        <Link
                                          key={`${item.key}-${subItem.path}-${subItem.label}`}
                                          href={subItem.path}
                                          onClick={() => setIsOpen(false)}
                                          className={`block px-3 py-2.5 text-sm rounded-md ${
                                            subItem.label.includes("Cost Calculator")
                                              ? "text-[var(--privet-green)] font-semibold"
                                              : "text-[var(--atlantic-navy)]/85 hover:text-[var(--privet-green)]"
                                          }`}
                                        >
                                          <span>{subItem.label}</span>
                                          {subItem.badge && (
                                            <span className="ml-2 inline-flex rounded-full bg-[var(--privet-green)]/10 text-[var(--privet-green)] px-2 py-0.5 text-[10px] font-semibold align-middle">
                                              {subItem.badge}
                                            </span>
                                          )}
                                        </Link>
                                      ) : (
                                        <div
                                          key={`${item.key}-nolink-${subItem.label}`}
                                          className="block px-3 py-2.5 text-sm rounded-md text-[var(--privet-green)] font-semibold bg-[var(--sandstone)]/60"
                                        >
                                          <span>{subItem.label}</span>
                                          {subItem.badge && (
                                            <span className="ml-2 inline-flex rounded-full bg-[var(--privet-green)]/10 text-[var(--privet-green)] px-2 py-0.5 text-[10px] font-semibold align-middle">
                                              {subItem.badge}
                                            </span>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        mobileItems.map((subItem) =>
                          !subItem.path ? (
                            <p
                              key={`${item.key}-group-${subItem.label}`}
                              className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans"
                            >
                              {subItem.label}
                            </p>
                          ) : (
                            <Link
                              key={`${item.key}-${subItem.path}-${subItem.label}`}
                              href={subItem.path}
                              onClick={() => setIsOpen(false)}
                              className="block px-3 py-2 text-sm text-[var(--atlantic-navy)]/80 hover:text-[var(--privet-green)] rounded-md"
                            >
                              {subItem.label}
                            </Link>
                          ),
                        )
                      )}
                      {item.key === "resources" && (
                        <Link
                          href="/resources"
                          onClick={() => setIsOpen(false)}
                          className="block mt-2 px-3 py-3 text-sm font-semibold text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] rounded-md border border-[var(--cedar-shingle)]/20"
                        >
                          Explore All Resources
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* CTA */}
            <div className="pt-3">
              <Link
                href={navCta.path}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-[var(--privet-green)] text-white px-5 py-3 text-sm font-medium rounded-md"
              >
                {navCta.label}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
