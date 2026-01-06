import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Video, Phone, MapPin, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function RecruiterConnect() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    recruiter_name: "",
    company: "",
    meeting_date: "",
    meeting_type: "virtual",
    meeting_link: "",
    topics: "",
    notes: ""
  });

  React.useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.RecruiterMeeting.list("-meeting_date", 50);
      setMeetings(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const scheduleMeeting = async () => {
    if (!formData.recruiter_name || !formData.company || !formData.meeting_date) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const topics = formData.topics ? formData.topics.split(",").map(t => t.trim()) : [];
      await base44.entities.RecruiterMeeting.create({
        ...formData,
        topics,
        status: "scheduled"
      });
      setShowForm(false);
      setFormData({
        recruiter_name: "",
        company: "",
        meeting_date: "",
        meeting_type: "virtual",
        meeting_link: "",
        topics: "",
        notes: ""
      });
      await loadMeetings();
    } catch (err) {
      console.error(err);
      alert("Failed to schedule meeting");
    }
  };

  const deleteMeeting = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    try {
      await base44.entities.RecruiterMeeting.delete(id);
      await loadMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.RecruiterMeeting.update(id, { status });
      await loadMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-slate-50 text-slate-700 border-slate-200"
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
            <Calendar className="w-4 h-4" />
            Recruiter Connect
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Schedule Meetings
          </h1>
          <p className="text-lg text-slate-600">
            Keep track of your recruiter and hiring manager meetings
          </p>
        </motion.div>

        <div className="mb-6">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule New Meeting
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle>New Meeting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Recruiter/Contact Name *</Label>
                    <Input
                      value={formData.recruiter_name}
                      onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
                      placeholder="e.g., Jane Smith"
                    />
                  </div>
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Google"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Meeting Date & Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.meeting_date}
                      onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Meeting Type</Label>
                    <Select
                      value={formData.meeting_type}
                      onValueChange={(val) => setFormData({ ...formData, meeting_type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual (Zoom/Teams)</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Meeting Link (Zoom, Teams, etc.)</Label>
                  <Input
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div>
                  <Label>Topics to Discuss (comma-separated)</Label>
                  <Input
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    placeholder="e.g., Software Engineer role, Company culture, Remote work policy"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes or preparation items..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={scheduleMeeting} className="bg-green-600 hover:bg-green-700">
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : meetings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-600 mb-2">No meetings scheduled</h3>
              <p className="text-slate-500">Schedule your first recruiter meeting to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting, idx) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {meeting.recruiter_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-800">{meeting.recruiter_name}</h3>
                            <p className="text-slate-600">{meeting.company}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(meeting.meeting_date), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                              <div className="flex items-center gap-1">
                                {meeting.meeting_type === "virtual" && <Video className="w-4 h-4" />}
                                {meeting.meeting_type === "phone" && <Phone className="w-4 h-4" />}
                                {meeting.meeting_type === "in_person" && <MapPin className="w-4 h-4" />}
                                {meeting.meeting_type}
                              </div>
                            </div>
                            {meeting.topics && meeting.topics.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {meeting.topics.map((topic, i) => (
                                  <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {meeting.notes && (
                              <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">{meeting.notes}</p>
                            )}
                            {meeting.meeting_link && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-3"
                                onClick={() => window.open(meeting.meeting_link, "_blank")}
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Join Meeting
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={statusColors[meeting.status]}>
                          {meeting.status}
                        </Badge>
                        {meeting.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(meeting.id, "completed")}
                            >
                              Mark Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(meeting.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMeeting(meeting.id)}
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