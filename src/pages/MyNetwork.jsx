import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Linkedin, Mail, Phone, Loader2, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function MyNetwork() {
  const [contacts, setContacts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("all");

  React.useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.NetworkContact.list("-created_date", 100);
      setContacts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const deleteContact = async (id) => {
    if (!confirm("Remove this contact from your network?")) return;
    try {
      await base44.entities.NetworkContact.delete(id);
      await loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.NetworkContact.update(id, { 
        connection_status: status,
        last_contacted: new Date().toISOString()
      });
      await loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || contact.connection_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    prospect: "bg-slate-50 text-slate-700 border-slate-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    connected: "bg-green-50 text-green-700 border-green-200",
    messaged: "bg-blue-50 text-blue-700 border-blue-200"
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            My Network
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Network Contacts
          </h1>
          <p className="text-lg text-slate-600">
            Manage your professional connections and track interactions
          </p>
        </motion.div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Search by name, company, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="prospect">Prospects</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="messaged">Messaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>Total: <strong>{contacts.length}</strong></span>
              <span>Connected: <strong>{contacts.filter(c => c.connection_status === "connected").length}</strong></span>
              <span>Pending: <strong>{contacts.filter(c => c.connection_status === "pending").length}</strong></span>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-600 mb-2">
                {searchTerm || filterStatus !== "all" ? "No contacts match your filters" : "No contacts yet"}
              </h3>
              <p className="text-slate-500">Start building your network using People Search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContacts.map((contact, idx) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {contact.full_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-800">{contact.full_name}</h3>
                            <p className="text-slate-600">{contact.job_title}</p>
                            <p className="text-sm text-slate-500">{contact.company}{contact.location && ` • ${contact.location}`}</p>
                            {contact.notes && (
                              <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">{contact.notes}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge className={statusColors[contact.connection_status]}>
                                {contact.connection_status}
                              </Badge>
                              {contact.source && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                  {contact.source}
                                </Badge>
                              )}
                              {contact.tags?.map((tag, i) => (
                                <Badge key={i} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {contact.last_contacted && (
                              <p className="text-xs text-slate-500 mt-2">
                                Last contacted: {format(new Date(contact.last_contacted), "MMM d, yyyy")}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {contact.linkedin_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(contact.linkedin_url, "_blank")}
                                >
                                  <Linkedin className="w-4 h-4 mr-2" />
                                  LinkedIn
                                </Button>
                              )}
                              {contact.email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.href = `mailto:${contact.email}`}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Email
                                </Button>
                              )}
                              {contact.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.href = `tel:${contact.phone}`}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {contact.connection_status === "prospect" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(contact.id, "pending")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Mark Pending
                          </Button>
                        )}
                        {contact.connection_status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(contact.id, "connected")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Connected
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteContact(contact.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}