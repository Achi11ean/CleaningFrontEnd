import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

/* ───────────────────────────────
   Font
─────────────────────────────── */

Font.register({
  family: "Aspire",
  src: "/Aspire.ttf",
});

/* ───────────────────────────────
   Styles
─────────────────────────────── */

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 120,
    marginBottom: 10,
  },

  companyName: {
    fontFamily: "Aspire",
    fontSize: 22,
  },

  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  clientBlock: {
    marginTop: 10,
    fontSize: 11,
  },

  block: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },

  serviceBox: {
    marginTop: 10,
    padding: 14,
    border: "1 solid #d1d5db",
    borderRadius: 6,
    backgroundColor: "#f9fafb",
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  label: {
    color: "#6b7280",
  },
roomBlock: {
  marginTop: 10,
  padding: 10,
  border: "1 solid #e5e7eb",
  borderRadius: 6,
  backgroundColor: "#ffffff",
},

roomHeader: {
  fontSize: 12,
  fontWeight: "bold",
  marginBottom: 6,
  color: "#111827",
},

sectionBlock: {
  marginTop: 6,
},

sectionHeader: {
  fontSize: 11,
  fontWeight: "bold",
  marginBottom: 2,
  color: "#374151",
},

itemRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  fontSize: 10,
  marginBottom: 2,
},

itemName: {
  color: "#111827",
},

itemPoints: {
  color: "#6b7280",
},
  totalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    color: "#047857",
  },

  notesBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    border: "1 solid #e5e7eb",
    borderRadius: 6,
  },

  contactBox: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: "1 solid #e5e7eb",
  },

  contactText: {
    fontSize: 10,
    marginBottom: 2,
  },

  disclaimer: {
    marginTop: 20,
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
  },
});

/* ───────────────────────────────
   Helper
─────────────────────────────── */

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  return `${h}h ${m}m`;
}
function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}


const RECUR_LABELS = {
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
};
/* ───────────────────────────────
   Component
─────────────────────────────── */

export default function PrintConsultation({
  consultation,
  client,
    groupedRooms,
  serviceType,
  recurringFrequency,
  pricing,
  totalTime,
  transitionMinutes,
  breakMinutes,
  maintenanceTime,
  maintenanceTotal,
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo2.jpg" style={styles.logo} />

          <Text style={styles.companyName}>
            A Breath of Fresh Air Cleaning Services
          </Text>

          <Text style={styles.subtitle}>
            Cleaning Consultation Estimate
          </Text>

          <Text style={styles.subtitle}>
            Prepared on{" "}
            {new Date(consultation.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Client */}
        {client && (
          <View style={styles.clientBlock}>
            <Text>
              Prepared for: {client.first_name} {client.last_name}
            </Text>
          </View>
        )}
{/* Cleaning Breakdown */}
{groupedRooms && (
  <View style={styles.block}>
    <Text style={styles.sectionTitle}>
      Cleaning Breakdown
    </Text>

    {Object.values(groupedRooms).map(room => {

      const points = Number(room.total_points) || 0;
      const minutes = points * 6;

      return (
        <View key={room.room.id} style={styles.roomBlock}>

          {/* Room Header */}
          <Text style={styles.roomHeader}>
            {room.room.label}
          </Text>

          {/* Sections */}
          {Object.values(room.sections).map(section => (

            <View key={section.section_name} style={styles.sectionBlock}>

              <Text style={styles.sectionHeader}>
                {section.section_name}
              </Text>

              {section.entries.map(entry => {

                const pts = Number(entry.calculated_points) || 0;
                const mins = pts * 6;

                return (
                  <View key={entry.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>
                      {entry.item_title}
                    </Text>

                 
                  </View>
                );
              })}

            </View>

          ))}

        </View>
      );

    })}
  </View>
)}
        {/* Service Type */}
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>
            Selected Service Type
          </Text>

          <Text>
            {serviceType === "one_time"
              ? "One-Time Cleaning"
              : "Recurring Cleaning"}
          </Text>
          {serviceType === "recurring" && (
  <Text style={{ marginTop: 4 }}>
    Frequency: {RECUR_LABELS[recurringFrequency]}
  </Text>
)}
        </View>

        {/* One Time */}
        {serviceType === "one_time" && totalTime && (
          <View style={styles.serviceBox}>
            <Text style={styles.serviceTitle}>
              One-Time Deep Clean
            </Text>

            <View style={styles.row}>
              <Text style={styles.label}>
                Estimated Onsite Time
              </Text>
              <Text>{formatHours(totalTime.onsiteHours)}</Text>
            </View>
{/* {transitionMinutes > 0 && (
  <View style={styles.row}>
    <Text style={styles.label}>Room Transition Time</Text>
    <Text>{transitionMinutes} min</Text>
  </View>
)}

{breakMinutes > 0 && (
  <View style={styles.row}>
    <Text style={styles.label}>Crew Break</Text>
    <Text>{breakMinutes} min</Text>
  </View>
)} */}
            <View style={{ marginTop: 8 }}>

  <View style={styles.row}>
    <Text style={styles.label}>Subtotal</Text>
    <Text>${pricing.finalTotal.toFixed(2)}</Text>
  </View>

  {pricing.discountPercent > 0 && (
    <View style={styles.row}>
      <Text style={styles.label}>
        Discount ({pricing.discountPercent}%)
      </Text>
      <Text>- ${pricing.discountAmount.toFixed(2)}</Text>
    </View>
  )}

  <View style={styles.row}>
    <Text style={styles.label}>CT Sales Tax (6.35%)</Text>
    <Text>${pricing.salesTax.toFixed(2)}</Text>
  </View>

  <Text style={styles.totalPrice}>
    Total: ${pricing.totalWithTax.toFixed(2)}
  </Text>

</View>
          </View>
        )}

        {/* Recurring */}
        {serviceType === "recurring" && (
          <View>

            {/* Initial */}
            <View style={styles.serviceBox}>
              <Text style={styles.serviceTitle}>
                Initial Deep Clean
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>
                  Estimated Onsite Time
                </Text>
                <Text>{formatHours(totalTime.onsiteHours)}</Text>
              </View>
{/* {transitionMinutes > 0 && (
  <View style={styles.row}>
    <Text style={styles.label}>Room Transition Time</Text>
    <Text>{transitionMinutes} min</Text>
  </View>
)}

{breakMinutes > 0 && (
  <View style={styles.row}>
    <Text style={styles.label}>Crew Break</Text>
    <Text>{breakMinutes} min</Text>
  </View>
)} */}
        <View style={{ marginTop: 8 }}>

  <View style={styles.row}>
    <Text style={styles.label}>Subtotal</Text>
    <Text>${pricing.finalTotal.toFixed(2)}</Text>
  </View>

  {pricing.discountPercent > 0 && (
    <View style={styles.row}>
      <Text style={styles.label}>
        Discount ({pricing.discountPercent}%)
      </Text>
      <Text>- ${pricing.discountAmount.toFixed(2)}</Text>
    </View>
  )}

  <View style={styles.row}>
    <Text style={styles.label}>CT Sales Tax (6.35%)</Text>
    <Text>${pricing.salesTax.toFixed(2)}</Text>
  </View>

  <Text style={styles.totalPrice}>
    Total: ${pricing.totalWithTax.toFixed(2)}
  </Text>

</View>
            </View>

            {/* Maintenance */}
            <View style={styles.serviceBox}>
       <Text style={styles.serviceTitle}>
  Recurring Maintenance Clean
</Text>

<Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 6 }}>
  Schedule: {RECUR_LABELS[recurringFrequency] || "Weekly"}
</Text>
              <View style={styles.row}>
                <Text style={styles.label}>
                  Estimated Onsite Time
                </Text>
                <Text>
                  {formatHours(maintenanceTime.onsiteHours)}
                </Text>
              </View>
{/* {transitionMinutes > 0 && (
  <View style={styles.row}>
    <Text style={styles.label}>Room Transition Time</Text>
    <Text>{transitionMinutes} min</Text>
  </View>
)}

{breakMinutes > 0 && (
  <View style={styles.row}>
    <Text style={styles.label}>Crew Break</Text>
    <Text>{breakMinutes} min</Text>
  </View>
)} */}<Text style={styles.totalPrice}>
  Estimated Price: ${pricing.finalTotal.toFixed(2)}
</Text>
            </View>

          </View>
        )}

        {/* Consultation Notes */}
        {consultation.notes && (
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>
              Consultation Notes
            </Text>

            <View style={styles.notesBox}>
              <Text>{consultation.notes}</Text>
            </View>
          </View>
        )}

        {/* Contact */}
        <View style={styles.contactBox}>
          <Text style={styles.sectionTitle}>
            Questions or Next Steps?
          </Text>

     
          <Text style={styles.contactText}>
            ✉️ Abreathoffreshaircs@gmail.com
          </Text>
<Text style={styles.contactText}>
  Phone: (860) 940-4381
</Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This document represents an estimate based on the
          consultation findings. Final pricing may vary if the
          scope of work changes or additional services are
          requested.
        </Text>

      </Page>
    </Document>
  );
}