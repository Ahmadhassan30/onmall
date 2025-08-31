"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "@/lib/auth-client";
import {
  SearchIcon,
  CartIcon,
  UserIcon,
  HeartIcon,
  MenuIcon,
  ChevronDownIcon,
  BellIcon,
  LocationIcon,
} from "@/components/icons";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
  };

  const categories = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Sports",
    "Books",
    "Beauty",
    "Automotive",
    "Toys",
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9 text-sm">
            {/* Left side - Location */}
            <div className="flex items-center space-x-1 text-gray-600">
              <LocationIcon className="w-3 h-3" />
              <span>Delivery all across Pakistan</span>
            </div>

            {/* Right side - Links */}
            <div className="hidden md:flex items-center space-x-6 text-gray-600">
              <Link href="/seller" className="hover:text-orange-500 transition-colors">
                Sell on OnMall
              </Link>
              <Link href="/help" className="hover:text-orange-500 transition-colors">
                Customer Care
              </Link>
              <Link href="/track" className="hover:text-orange-500 transition-colors">
                Track My Order
              </Link>
              <div className="flex items-center space-x-1">
                <span>Language:</span>
                <button className="flex items-center hover:text-orange-500 transition-colors">
                  English <ChevronDownIcon className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.png"
                  alt="OnMall Logo"
                  width={40}
                  height={40}
                  className="rounded-lg object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900">OnMall</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <div className="flex">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search for products, brands and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 h-10 rounded-l-md rounded-r-none border-r-0 focus:border-orange-300 focus:ring-orange-200"
                  />
                  <Button
                    size="sm"
                    className="absolute right-0 top-0 h-10 px-4 bg-orange-500 hover:bg-orange-600 rounded-l-none"
                  >
                    <SearchIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Search Suggestions Dropdown */}
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-2">Popular Searches</div>
                    {["iPhone 15", "Samsung Galaxy", "Nike Shoes", "MacBook Pro"].map((term) => (
                      <div
                        key={term}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <SearchIcon className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-sm">{term}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-6">
            {/* Login/Register or User Menu */}
            <div className="hidden lg:flex items-center space-x-3">
              {isPending ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : session?.user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm">Hi, {session.user.name || session.user.email}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-orange-500"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/auth/sign-in">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-orange-500">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Action Icons */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <BellIcon className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                  3
                </Badge>
              </button>

              {/* Wishlist */}
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <HeartIcon className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                  2
                </Badge>
              </button>

              {/* Cart */}
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <CartIcon className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center p-0">
                  4
                </Badge>
              </button>

              {/* Mobile Menu */}
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <MenuIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 overflow-x-auto scrollbar-hide">
            <div className="flex items-center space-x-8 min-w-max">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase()}`}
                  className="text-sm text-gray-600 hover:text-orange-500 transition-colors whitespace-nowrap"
                >
                  {category}
                </Link>
              ))}
              <Link
                href="/flash-sale"
                className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors whitespace-nowrap"
              >
                🔥 Flash Sale
              </Link>
              <Link
                href="/new-arrivals"
                className="text-sm text-green-600 font-medium hover:text-green-700 transition-colors whitespace-nowrap"
              >
                ✨ New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-gray-100 bg-white">
        <div className="px-4 py-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 h-10"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1 h-8 px-3 bg-orange-500 hover:bg-orange-600"
            >
              <SearchIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Login/Register or User Menu */}
              <div className="mb-6 space-y-3">
                {isPending ? (
                  <div className="h-9 bg-gray-200 animate-pulse rounded"></div>
                ) : session?.user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {session.user.name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.user.email}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSignOut}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link href="/auth/sign-in" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <UserIcon className="w-4 h-4 mr-3" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/sign-up" className="block">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Items */}
              <div className="space-y-4">
                <Link href="/seller" className="block py-2 text-gray-700 hover:text-orange-500">
                  Sell on OnMall
                </Link>
                <Link href="/help" className="block py-2 text-gray-700 hover:text-orange-500">
                  Customer Care
                </Link>
                <Link href="/track" className="block py-2 text-gray-700 hover:text-orange-500">
                  Track My Order
                </Link>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Categories</h3>
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={`/category/${category.toLowerCase()}`}
                      className="block py-2 text-sm text-gray-600 hover:text-orange-500"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
