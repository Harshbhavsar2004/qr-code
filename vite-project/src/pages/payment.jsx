"use client";

import { useState } from "react";
import { Users, User, Users2, Crown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TicketBooking() {
  const [ticketType, setTicketType] = useState("male-stag");
  const [individualTicketCount, setIndividualTicketCount] = useState(1);
  const [primaryContact, setPrimaryContact] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [individualPersons, setIndividualPersons] = useState([]);
  const [tablePersons, setTablePersons] = useState([
    { name: "", email: "", phone: "" },
  ]);
  const [tablePersonCount, setTablePersonCount] = useState(0);

  // Ticket pricing information
  const ticketPrices = {
    "male-stag": { entry: 500, cover: 100, maxPersons: 1 },
    "female-stag": { entry: 400, cover: 100, maxPersons: 1 },
    couple: { entry: 800, cover: 300, maxPersons: 2 },
    "table-silver": { entry: 6000, cover: 5000, minPersons: 6, maxPersons: 7 },
    "table-gold": { entry: 9000, cover: 8000, minPersons: 9, maxPersons: 10 },
    "table-platinum": {
      entry: 11000,
      cover: 9000,
      minPersons: 13,
      maxPersons: 14,
    },
  };

  const handleTicketTypeChange = (value) => {
    setTicketType(value);
    setIndividualTicketCount(1);

    // Reset table person details based on ticket type
    if (value.startsWith("table-")) {
      const ticketInfo = ticketPrices[value];
      const initialCount = ticketInfo.minPersons || 1;
      setTablePersonCount(initialCount);
      setTablePersons(
        Array(initialCount)
          .fill(0)
          .map(() => ({ name: "", email: "", phone: "" }))
      );
    }
  };

  const handleIndividualTicketCountChange = (value) => {
    setIndividualTicketCount(Number.parseInt(value));
  };

  const handleTablePersonCountChange = (value) => {
    const count = Number.parseInt(value);
    setTablePersonCount(count);

    // Update persons array based on new count
    if (count > tablePersons.length) {
      // Add new empty person details
      setTablePersons([
        ...tablePersons,
        ...Array(count - tablePersons.length)
          .fill(0)
          .map(() => ({ name: "", email: "", phone: "" })),
      ]);
    } else if (count < tablePersons.length) {
      // Remove excess person details
      setTablePersons(tablePersons.slice(0, count));
    }
  };

  const updatePrimaryContact = (field, value) => {
    setPrimaryContact({ ...primaryContact, [field]: value });
  };

  const updateTablePersonDetail = (index, field, value) => {
    const updatedPersons = [...tablePersons];
    updatedPersons[index] = { ...updatedPersons[index], [field]: value };
    setTablePersons(updatedPersons);
  };

  const calculateTotalPrice = () => {
    if (ticketType.startsWith("table-")) {
      return ticketPrices[ticketType].entry;
    } else if (ticketType === "couple") {
      return (
        ticketPrices[ticketType].entry * Math.ceil(individualTicketCount / 2)
      );
    } else {
      return ticketPrices[ticketType].entry * individualTicketCount;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const totalAmount = calculateTotalPrice();
    const singleTicketPrice = ticketPrices[ticketType].entry;
  
    try {
      // 1. Create Razorpay order
      const res = await fetch("http://localhost:5000/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });
  
      const { order } = await res.json();
  
      // 2. Launch Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_deehYNRaiONGTI",
        amount: order.amount,
        currency: "INR",
        name: "Concert Ticket",
        description: "Summer Music Festival 2024",
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify payment & send tickets
          const verifyRes = await fetch("http://localhost:5000/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              email: primaryContact.email, // Main contact
              name: primaryContact.name,
              attendees: tablePersons,
              package: ticketType, // Include package information
              price: singleTicketPrice,
            }),
          });
  
          const data = await verifyRes.json();
          if (verifyRes.ok) {
            alert("Tickets sent to email!");
          } else {
            alert(data.message || "Failed to send tickets.");
          }
        },
        theme: { color: "#0f172a" },
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong!");
    }
  };

  const renderTablePersonForms = () => {
    return tablePersons.map((person, index) => (
      <div key={index} className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Person #{index + 1}</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`name-${index}`}>Full Name</Label>
            <Input
              id={`name-${index}`}
              value={person.name}
              onChange={(e) =>
                updateTablePersonDetail(index, "name", e.target.value)
              }
              placeholder="Enter full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${index}`}>Email Address</Label>
            <Input
              id={`email-${index}`}
              type="email"
              value={person.email}
              onChange={(e) =>
                updateTablePersonDetail(index, "email", e.target.value)
              }
              placeholder="Enter email address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`phone-${index}`}>Phone Number</Label>
            <Input
              id={`phone-${index}`}
              type="tel"
              value={person.phone}
              onChange={(e) =>
                updateTablePersonDetail(index, "phone", e.target.value)
              }
              placeholder="Enter phone number"
              required
            />
          </div>
        </div>
      </div>
    ));
  };

  const renderTableOptions = () => {
    if (!ticketType.startsWith("table-")) return null;

    const ticketInfo = ticketPrices[ticketType];
    const minPersons = ticketInfo.minPersons || 1;
    const maxPersons = ticketInfo.maxPersons || 1;

    const options = [];
    for (let i = minPersons; i <= maxPersons; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i} people
        </SelectItem>
      );
    }

    return (
      <div className="space-y-2 mb-6">
        <Label htmlFor="person-count">Number of People</Label>
        <Select
          value={tablePersonCount.toString()}
          onValueChange={handleTablePersonCountChange}
        >
          <SelectTrigger id="person-count" className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select number of people" />
          </SelectTrigger>
          <SelectContent>{options}</SelectContent>
        </Select>
      </div>
    );
  };

  const renderIndividualTicketOptions = () => {
    if (ticketType.startsWith("table-")) return null;

    const maxCount = ticketType === "couple" ? 10 : 20; // Arbitrary max limits
    const options = [];

    for (let i = 1; i <= maxCount; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i}{" "}
          {ticketType === "couple"
            ? i === 1
              ? "couple"
              : "couples"
            : "ticket(s)"}
        </SelectItem>
      );
    }

    return (
      <div className="space-y-2 mb-6">
        <Label htmlFor="ticket-count">Number of Tickets</Label>
        <Select
          value={individualTicketCount.toString()}
          onValueChange={handleIndividualTicketCountChange}
        >
          <SelectTrigger id="ticket-count" className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select number of tickets" />
          </SelectTrigger>
          <SelectContent>{options}</SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Event Ticket Booking</CardTitle>
        <CardDescription>
          Select your ticket type and provide the required information to book
          your tickets.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Entry</TabsTrigger>
              <TabsTrigger value="table">Table Reservations</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4 pt-4">
              <RadioGroup
                value={ticketType}
                onValueChange={(value) => handleTicketTypeChange(value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="border rounded-lg p-4 relative">
                  <RadioGroupItem
                    value="male-stag"
                    id="male-stag"
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4 flex items-center gap-2">
                    {" "}
                    <User /> Male Stag{" "}
                  </div>{" "}
                  <div className="text-sm text-muted-foreground">
                    Entry: ₹500 + ₹100 cover
                  </div>{" "}
                </div>
                <div className="border rounded-lg p-4 relative">
                  <RadioGroupItem
                    value="female-stag"
                    id="female-stag"
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4 flex items-center gap-2">
                    <Users2 /> Female Stag
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Entry: ₹400 + ₹100 cover
                  </div>
                </div>

                <div className="border rounded-lg p-4 relative">
                  <RadioGroupItem
                    value="couple"
                    id="couple"
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4 flex items-center gap-2">
                    <Users /> Couple
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Entry: ₹800 + ₹300 cover
                  </div>
                </div>
              </RadioGroup>

              {renderIndividualTicketOptions()}

              <div className="space-y-4">
                <Label>Primary Contact Details</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primary-name">Full Name</Label>
                    <Input
                      id="primary-name"
                      value={primaryContact.name}
                      onChange={(e) =>
                        updatePrimaryContact("name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary-email">Email Address</Label>
                    <Input
                      id="primary-email"
                      type="email"
                      value={primaryContact.email}
                      onChange={(e) =>
                        updatePrimaryContact("email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary-phone">Phone Number</Label>
                    <Input
                      id="primary-phone"
                      type="tel"
                      value={primaryContact.phone}
                      onChange={(e) =>
                        updatePrimaryContact("phone", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="table" className="space-y-4 pt-4">
              <RadioGroup
                value={ticketType}
                onValueChange={(value) => handleTicketTypeChange(value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="border rounded-lg p-4 relative">
                  <RadioGroupItem
                    value="table-silver"
                    id="table-silver"
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4 flex items-center gap-2">
                    <Crown className="text-silver-500" /> Silver Table
                  </div>
                  <div className="text-sm text-muted-foreground">
                    6-7 people | ₹6000 + ₹5000 cover
                  </div>
                </div>

                <div className="border rounded-lg p-4 relative">
                  <RadioGroupItem
                    value="table-gold"
                    id="table-gold"
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4 flex items-center gap-2">
                    <Crown className="text-yellow-500" /> Gold Table
                  </div>
                  <div className="text-sm text-muted-foreground">
                    9-10 people | ₹9000 + ₹8000 cover
                  </div>
                </div>

                <div className="border rounded-lg p-4 relative">
                  <RadioGroupItem
                    value="table-platinum"
                    id="table-platinum"
                    className="absolute top-4 right-4"
                  />
                  <div className="mb-4 flex items-center gap-2">
                    <Crown className="text-gray-500" /> Platinum Table
                  </div>
                  <div className="text-sm text-muted-foreground">
                    13-14 people | ₹11000 + ₹9000 cover
                  </div>
                </div>
              </RadioGroup>

              {renderTableOptions()}
              {renderTablePersonForms()}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-lg font-medium">
            Total Price: ₹{calculateTotalPrice()}
          </div>
          <Button type="submit">Proceed to Payment</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
