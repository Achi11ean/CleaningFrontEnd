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
   Register Aspire Font
   ─────────────────────────────── */
Font.register({
  family: "Aspire",
  src: "/public/Aspire.ttf",
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

  /* Header */
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 120,
    height: "auto",
    marginBottom: 10,
  },
  companyName: {
    fontFamily: "Aspire",
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },

  block: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#6b7280",
  },
  notes: {
    marginTop: 6,
    fontStyle: "italic",
    color: "#4b5563",
  },
entryBox: {
  marginBottom: 8,
  paddingBottom: 6,
  borderBottom: "1 solid #e5e7eb",
},

entryTitleRow: {
  flexDirection: "row",
  justifyContent: "space-between",
},

entryMeta: {
  fontSize: 9,
  color: "#6b7280",
  marginTop: 2,
},

multiplierBox: {
  marginTop: 4,
  paddingLeft: 8,
},

multiplierText: {
  fontSize: 9,
  color: "#92400e",
},

entryNotes: {
  fontSize: 9,
  fontStyle: "italic",
  color: "#4b5563",
  marginTop: 3,
},
noteBox: {
  marginTop: 6,
  padding: 6,
  backgroundColor: "#f9fafb",
  border: "1 solid #e5e7eb",
  borderRadius: 4,
},
sectionName: {
  textDecoration: "underline",
},

noteLabel: {
  fontSize: 9,
  fontWeight: "bold",
  color: "#374151",
  marginBottom: 2,
},

noteText: {
  fontSize: 9,
  color: "#374151",
},

entryNoteBox: {
  marginTop: 5,
  padding: 5,
  backgroundColor: "#f8fafc",
  border: "1 solid #e2e8f0",
  borderRadius: 4,
},

multiplierBox: {
  marginTop: 5,
  padding: 6,
  backgroundColor: "#fffbeb",
  border: "1 solid #fde68a",
  borderRadius: 4,
},

multiplierTitle: {
  fontSize: 9,
  fontWeight: "bold",
  color: "#92400e",
  marginBottom: 2,
},

multiplierText: {
  fontSize: 9,
  color: "#78350f",
},

  pricingBox: {
    marginTop: 18,
    padding: 14,
    border: "1 solid #10b981",
    backgroundColor: "#ecfdf5",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#047857",
    marginTop: 6,
  },

  contactBox: {
    marginTop: 22,
    paddingTop: 12,
    borderTop: "1 solid #e5e7eb",
  },
  contactText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
  },

  disclaimer: {
    marginTop: 18,
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
  },
});

/* ───────────────────────────────
   Component
   ─────────────────────────────── */
export default function PrintConsultation({
  consultation,
  groupedRooms = {},
  pricing,
  client,
})

{
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* Company Header */}
        <View style={styles.header}>
<Image
  src="/logo2.jpg"
  style={{ width: 120, marginBottom: 12 }}
/>

          <Text style={styles.companyName}>
            A Breath of Fresh Air Cleaning Services
          </Text>
          <Text style={styles.subtitle}>
            Cleaning Consultation Estimate
          </Text>

          <Text style={styles.subtitle}>
            Prepared on {new Date(consultation.created_at).toLocaleString()}
          </Text>
        </View>
          {client && (
  <Text style={{ fontSize: 11, marginTop: 6 }}>
    Prepared for: {client.first_name} {client.last_name}
  </Text>
)}

        {/* Consultation Notes */}
        {consultation.notes && (
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>Consultation Notes</Text>
<View style={styles.noteBox}>
  <Text style={styles.noteLabel}>Summary</Text>
  <Text style={styles.noteText}>{consultation.notes}</Text>
</View>
          </View>
        )}

        {/* Sections */}
      {/* Sections */}
{/* Rooms */}
{Object.values(groupedRooms || {}).map((roomGroup) => (
  <View key={roomGroup.room.id} style={styles.block}>

    {/* ROOM HEADER */}
    <Text style={styles.sectionTitle}>
      {roomGroup.room.label} — {roomGroup.total_points} pts
    </Text>

    {roomGroup.room.square_feet && (
      <Text style={styles.notes}>
        {roomGroup.room.square_feet} sqft • multiplier ×
        {roomGroup.room.sqft_multiplier}
      </Text>
    )}

    {/* SECTIONS INSIDE ROOM */}
    {Object.values(roomGroup.sections).map((section) => (
      <View key={section.section_name} style={{ marginTop: 8 }}>

        <Text style={{ fontSize: 11, fontWeight: "bold" }}>
          {section.section_name} — {section.total_points} pts
        </Text>

        {section.entries[0]?.section_description && (
          <Text style={styles.notes}>
            {section.entries[0].section_description}
          </Text>
        )}

        {section.entries.map((e) => (
          <View key={e.id} style={styles.entryBox}>

            {/* Title */}
            <Text>{e.item_title}</Text>

            {/* Intensity */}
            <Text style={styles.entryMeta}>
              • Intensity: {e.intensity_label}
            </Text>

            {/* Item Notes */}
            {e.item_notes && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Item Notes</Text>
                <Text style={styles.noteText}>{e.item_notes}</Text>
              </View>
            )}

            {/* Multipliers */}
            {e.multipliers?.length > 0 && (
              <View style={styles.multiplierBox}>
                <Text style={styles.multiplierTitle}>
                  Applied Multipliers
                </Text>
                {e.multipliers.map((m) => (
                  <Text key={m.id} style={styles.multiplierText}>
                    • {m.label} × {m.multiplier}
                    {m.notes ? ` — ${m.notes}` : ""}
                  </Text>
                ))}
              </View>
            )}

            {/* Entry Notes */}
            {e.entry_notes && (
              <View style={styles.entryNoteBox}>
                <Text style={styles.noteLabel}>Entry Notes</Text>
                <Text style={styles.noteText}>
                  “{e.entry_notes}”
                </Text>
              </View>
            )}

          </View>
        ))}

      </View>
    ))}

  </View>
))}



        {/* Pricing Breakdown */}
        <View style={styles.pricingBox}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>



          <View style={styles.row}>
            <Text style={styles.label}>Base estimate</Text>
            <Text>${pricing.baseEstimate.toFixed(2)}</Text>
          </View>

          {pricing.discountPercent > 0 && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>
                  Discount ({pricing.discountPercent}%)
                </Text>
                <Text>− $ {pricing.discountAmount.toFixed(2)}</Text>
              </View>

              {pricing.discountNotes && (
                <Text style={styles.notes}>
                  Discount notes: {pricing.discountNotes}
                </Text>
              )}
            </>
          )}

          <Text style={styles.totalText}>
            Final Estimated Cost: ${pricing.finalTotal.toFixed(2)}
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactBox}>
          <Text style={styles.sectionTitle}>Questions or Next Steps?</Text>
          <Text style={styles.contactText}>
            If you have not yet finalized your services, please contact us at:
          </Text>
          <Text style={styles.contactText}>
            📞 (860) 940-4381
          </Text>
          <Text style={styles.contactText}>
            ✉️ Abreathoffreshaircs@gmail.com
          </Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This document represents an estimate based on the consultation
          findings. Final pricing may vary based on scope changes or
          additional services requested.
        </Text>

      </Page>
    </Document>
  );
}
