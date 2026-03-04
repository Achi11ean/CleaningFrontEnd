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

/* ───────────────────────────────
   Component
─────────────────────────────── */

export default function PrintConsultation({
  consultation,
  client,
  serviceType,
  pricing,
  totalTime,
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

            <Text style={styles.totalPrice}>
              Estimated Price: ${pricing.finalTotal.toFixed(2)}
            </Text>
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

              <Text style={styles.totalPrice}>
                Estimated Price: ${pricing.finalTotal.toFixed(2)}
              </Text>
            </View>

            {/* Maintenance */}
            <View style={styles.serviceBox}>
              <Text style={styles.serviceTitle}>
                Recurring Maintenance Clean
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>
                  Estimated Onsite Time
                </Text>
                <Text>
                  {formatHours(maintenanceTime.onsiteHours)}
                </Text>
              </View>

              <Text style={styles.totalPrice}>
                Estimated Price: ${maintenanceTotal.toFixed(2)}
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
            📞 (860) 940-4381
          </Text>

          <Text style={styles.contactText}>
            ✉️ Abreathoffreshaircs@gmail.com
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