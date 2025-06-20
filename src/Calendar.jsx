import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import { parseISO } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "./App.css"
const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cleaning dates
  useEffect(() => {
    const fetchCleaningDates = async () => {
      try {
        const response = await axios.get("/api/cleaning_dates_summary");
        const data = response.data;

        // Combine one-time cleanings and recurring payments
        const combinedEvents = [
          ...data.one_time_cleanings.map((item) => ({
            id: item.cleaning_id,
            type: "one-time",
            title: `One-Time: ${item.inquiry_name}`,
            start: parseISO(item.date_time),
            end: parseISO(item.date_time),
            inquiry_id: item.inquiry_id,
            inquiry_name: item.inquiry_name,
            phone_number: item.phone_number || "No phone number", // Add phone number
            notes: item.notes || "No notes",
            paid: item.paid,
          })),
          ...data.recurring_paid_records.flatMap((record) =>
            record.dates_related.split(", ").map((date) => ({
              id: record.recurring_paid_id,
              type: "recurring",
              title: `Recurring: ${record.inquiry_name}`,
              start: parseISO(date),
              end: parseISO(date),
              inquiry_id: record.inquiry_id,
              inquiry_name: record.inquiry_name,
              phone_number: record.phone_number || "No phone number", // Add phone number

              notes: record.notes || "No notes available", // Use the actual notes from the record
              paid: record.dates_related.split(", ").map((date) => parseISO(date)), // Convert to an array of parsed dates
            }))
          ),
        ];

        setEvents(combinedEvents);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching cleaning dates:", err);
        setError("Failed to load cleaning dates.");
        setLoading(false);
      }
    };

    fetchCleaningDates();
  }, []);

  // Calendar localization
  const localizer = momentLocalizer(moment);

  // Event click handler
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  if (loading) return <p>Loading calendar...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div
      className="max-w-full mx-auto p-1 rounded-lg shadow-md"
      style={{
        background: "linear-gradient(135deg, #fbc2eb, #a6c1ee)", // Gradient colors
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h2
        className="text-3xl font-serif border-2 rounded-2xl border-blue-900 font-extrabold mb-4 text-center text-gray-700"
        style={{
          fontFamily: "'Aspire', sans-serif",
        }}
      >
        Cleaning Calendar
      </h2>

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{
          height: 500,
          backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly transparent white for readability
          borderRadius: "12px",
          padding: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        titleAccessor={(event) => event.title}
        defaultView="month"
        onSelectEvent={handleEventClick}
      />

      {selectedEvent && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-2">Event Details</h3>
          <p>
            <strong>Type:</strong>{" "}
            {selectedEvent.type === "one-time"
              ? "One-Time Cleaning"
              : "Recurring Payment"}
          </p>
          <p>
            <strong>Inquiry Name:</strong> <br/> {selectedEvent.inquiry_name}
          </p>
          <p>
            <strong>Phone Number:</strong> <br/>{selectedEvent.phone_number}
          </p>
          <p>
            <strong>Notes:</strong> <br/> {selectedEvent.notes}
          </p>
          <p>
  <strong>Paid:</strong>{" "}
  {Array.isArray(selectedEvent.paid) ? (
    // Display list of dates for recurring cleanings
    <ul>
      {selectedEvent.paid.map((date, index) => (
        <li key={index}>{new Date(date).toLocaleDateString()}</li>
      ))}
    </ul>
  ) : selectedEvent.paid !== null ? (
    // Display "Yes" or "No" for one-time cleanings
    selectedEvent.paid ? "Yes" : "No"
  ) : (
    "n/a"
  )}
</p>

          <button
            onClick={() => setSelectedEvent(null)}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Calendar;
