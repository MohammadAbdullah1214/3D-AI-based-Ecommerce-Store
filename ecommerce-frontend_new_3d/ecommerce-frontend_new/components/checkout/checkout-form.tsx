"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CheckoutFormProps {
  onSubmit: (formData: any) => void
  isSubmitting: boolean
}

export default function CheckoutForm({ onSubmit, isSubmitting }: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    paymentMethod: "credit_card",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        {/* Contact Information */}
        <Card className="backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>We'll use this information to contact you about your order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription>Where should we send your order?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" value={formData.country} onChange={handleChange} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Select how you'd like to pay.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={formData.paymentMethod} onValueChange={handleRadioChange} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card">Credit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal">PayPal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer">Bank Transfer</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Order Notes */}
        <Card className="backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
            <CardDescription>Add any special instructions or delivery notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special instructions for delivery, etc."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
              Processing...
            </span>
          ) : (
            "Complete Order"
          )}
        </Button>
      </div>
    </form>
  )
}
