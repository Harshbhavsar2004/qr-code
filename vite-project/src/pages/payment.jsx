import { useState } from "react"
import { Music, User, Mail, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export default function ConcertTicketPurchase() {
  const [ticketCount, setTicketCount] = useState(1)
  const [persons, setPersons] = useState([{ name: "", email: "" }])
  const PRICE_PER_TICKET = 1

  const handleTicketCountChange = (value) => {
    const count = Number.parseInt(value)
    setTicketCount(count)

    // Update persons array based on new ticket count
    if (count > persons.length) {
      // Add new empty person details
      setPersons([
        ...persons,
        ...Array(count - persons.length)
          .fill(0)
          .map(() => ({ name: "", email: "" })),
      ])
    } else if (count < persons.length) {
      // Remove excess person details
      setPersons(persons.slice(0, count))
    }
  }

  const updatePersonDetail = (index, field, value) => {
    const updatedPersons = [...persons]
    updatedPersons[index] = { ...updatedPersons[index], [field]: value }
    setPersons(updatedPersons)
  }

  const calculateTotal = () => {
    return ticketCount * PRICE_PER_TICKET
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const totalAmount = calculateTotal();
  
    try {
      // 1. Create Razorpay order
      const res = await fetch("https://qr-code-8h8f.vercel.app/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });
  
      const { order } = await res.json();
  
      // 2. Launch Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_x0HMOJCEo5eIlI",
        amount: order.amount,
        currency: "INR",
        name: "Concert Ticket",
        description: "Summer Music Festival 2024",
        order_id: order.id,
        handler: async function (response ) {
          // 3. Verify payment & send tickets
          const verifyRes = await fetch("https://qr-code-8h8f.vercel.app/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              email: persons[0].email, // Main contact
              name: persons[0].name,
              attendees: persons,
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
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-6 w-6" />
          Summer Music Festival 2024
        </CardTitle>
        <CardDescription>
          Join us for an unforgettable night of music featuring top artists from around the world. Experience amazing
          performances, great food, and an electric atmosphere at the Summer Music Festival 2024. Don't miss this
          opportunity to create memories that will last a lifetime!
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ticket-count">Number of Tickets</Label>
            <Select value={ticketCount.toString()} onValueChange={handleTicketCountChange}>
              <SelectTrigger id="ticket-count" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select tickets" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "ticket" : "tickets"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Attendee Information</h3>
            {persons.map((person, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Ticket #{index + 1}</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`} className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id={`name-${index}`}
                      value={person.name}
                      onChange={(e) => updatePersonDetail(index, "name", e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`} className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={person.email}
                      onChange={(e) => updatePersonDetail(index, "email", e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Price per ticket</p>
                <p className="font-medium">₹{PRICE_PER_TICKET.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total amount</p>
                <p className="text-xl font-bold">₹{calculateTotal().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" size="lg">
            <CreditCard className="mr-2 h-4 w-4" />
            Proceed to Payment
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
