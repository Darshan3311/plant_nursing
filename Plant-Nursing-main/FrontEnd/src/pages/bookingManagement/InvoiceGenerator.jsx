import React, { useEffect, useRef, useState } from "react";
import axios from "../../lib/axios"; // adjust path if needed

// Invoice content (defensive)
function InvoiceContent({ booking }) {
  const defaultCompany = {
    name: "Your Nursery / Company Name",
    address: "123 Green Valley, Crop City",
    cityStateZip: "Maharashtra, 423203",
    phone: "+91 98765 43210",
    email: "info@yourcompany.com",
  };
  const defaultCustomer = {
    fullName: "Customer Name",
    address: "456 Farm Lane, Rural Town",
    cityStateZip: "Maharashtra, 423001",
    phone: "+91 99887 76655",
    email: "customer@example.com",
  };

  const invoiceNo =
    booking?.invoiceNo ||
    `INV-${(booking?._id || Date.now()).toString().slice(-6)}`;
  const invoiceDate =
    booking?.invoiceDate || new Date().toLocaleDateString("en-GB");

  const companyName = booking?.company?.name || defaultCompany.name;
  const companyAddress = booking?.company?.address || defaultCompany.address;
  const companyCityStateZip =
    booking?.company?.cityStateZip || defaultCompany.cityStateZip;
  const companyPhone = booking?.company?.phone || defaultCompany.phone;


  // Farmer may be string or object
  const farmerObj =
    typeof booking?.farmer === "string"
      ? {
          fullName: booking.farmer,
          phone: booking.farmerContact || "",
          address: "",
        }
      : booking?.farmer || {};

  const farmerName =
    farmerObj?.fullName || farmerObj?.name || defaultCustomer.fullName;
  const farmerAddress = farmerObj?.address || defaultCustomer.address;
  const farmerCityStateZip =
    farmerObj?.cityStateZip || defaultCustomer.cityStateZip;
  const farmerPhone =
    farmerObj?.phone || farmerObj?.contact || defaultCustomer.phone;
  const farmerEmail = farmerObj?.email || defaultCustomer.email;

  const bookingId = booking?._id || booking?.bookingId || "N/A";
  const plotNo = booking?.plotNumber || booking?.plotNo || "N/A";
  const cropGroup = booking?.cropGroup?.name || booking?.cropGroup || "N/A";
  const cropVariety = booking?.variety || booking?.crop || "N/A";
  const quantity = booking?.quantity
    ? `${booking.quantity} ${booking.unit || ""}`.trim()
    : "N/A";
  const dateOfBooking = booking?.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-GB")
    : "N/A";
  const dateOfSowing = booking?.sowingDate
    ? new Date(booking.sowingDate).toLocaleDateString("en-GB")
    : "N/A";
  const dateOfCompletion = booking?.dispatchDate
    ? new Date(booking.dispatchDate).toLocaleDateString("en-GB")
    : "N/A";

  const advancePayment = Number(booking?.advancePayment ?? 0);
  const pendingPayment = Number(booking?.pendingPayment ?? 0);
  const finalPayment = Number(
    booking?.finalPayment ??
      booking?.amount ??
      booking?.finalTotalPrice ??
      booking?.totalPayment ??
      0
  );
  const totalAmountDue = advancePayment + pendingPayment + finalPayment;

  const notes =
    booking?.notes ||
    "Payment due within 30 days. Please include invoice number with payment.";

  return (
    <div
      style={{
        width: "800px",
        padding: "24px",
        backgroundColor: "white",
        color: "#000",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "700",
          textAlign: "center",
          marginBottom: "24px",
          color: "#222",
        }}
      >
        INVOICE
      </h1>
      <hr style={{ borderTop: "2px solid #ccc", marginBottom: "24px" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#333",
            }}
          >
            {companyName}
          </h2>
          <div style={{ fontSize: "14px", color: "#555", lineHeight: 1.5 }}>
            {companyAddress}
            <br />
            {companyCityStateZip}
            <br />
            Phone: {companyPhone}
            <br />
           
          </div>
        </div>
        <div style={{ textAlign: "right", color: "#444" }}>
          <div
            style={{ fontWeight: "700", fontSize: "18px", marginBottom: "4px" }}
          >
            Invoice No.: {invoiceNo}
          </div>
          <div>Invoice Date: {invoiceDate}</div>
        </div>
      </div>

      <hr style={{ borderTop: "1px solid #ddd", marginBottom: "24px" }} />

      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "12px",
            color: "#333",
          }}
        >
          Billed To
        </h3>
        <div style={{ fontSize: "16px", fontWeight: "500", color: "#222" }}>
          {farmerName}
        </div>
        <div style={{ fontSize: "14px", color: "#555", lineHeight: 1.5 }}>
          {farmerAddress}
          <br />
          {farmerCityStateZip}
          <br />
          Phone: {farmerPhone}
          <br />
          Email: {farmerEmail}
        </div>
      </div>

      <hr style={{ borderTop: "1px solid #ddd", marginBottom: "24px" }} />

      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#333",
        }}
      >
        Booking & Crop Details
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "24px",
        }}
        border="1"
        cellPadding="8"
        cellSpacing="0"
      >
        <thead style={{ backgroundColor: "#f5f5f5" }}>
          <tr>
            <th
              style={{
                textAlign: "left",
                fontWeight: "600",
                fontSize: "14px",
                color: "#333",
              }}
            >
              Detail
            </th>
            <th
              style={{
                textAlign: "left",
                fontWeight: "600",
                fontSize: "14px",
                color: "#333",
              }}
            >
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Booking ID", bookingId],
            ["Farmer Name", farmerName],
            ["Plot No.", plotNo],
            ["Crop Group", cropGroup],
            ["Crop Variety", cropVariety],
            ["Quantity of Crop", quantity],
            ["Date of Booking", dateOfBooking],
            ["Date of Sowing", dateOfSowing],
            ["Dispatch Date", dateOfCompletion],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontSize: "14px", color: "#222" }}>{label}</td>
              <td style={{ fontSize: "14px", color: "#222" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr style={{ borderTop: "1px solid #ddd", marginBottom: "24px" }} />

      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#333",
        }}
      >
        Payment Summary
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "24px",
        }}
        border="1"
        cellPadding="8"
        cellSpacing="0"
      >
        <thead style={{ backgroundColor: "#f5f5f5" }}>
          <tr>
            <th
              style={{
                textAlign: "left",
                fontWeight: "600",
                fontSize: "14px",
                color: "#333",
              }}
            >
              Payment Type
            </th>
            <th
              style={{
                textAlign: "right",
                fontWeight: "600",
                fontSize: "14px",
                color: "#333",
              }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Advance Payment", advancePayment.toFixed(2)],
            ["Pending Payment", pendingPayment.toFixed(2)],
            ["Final Payment", finalPayment.toFixed(2)],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontSize: "14px", color: "#222" }}>{label}</td>
              <td
                style={{ fontSize: "14px", color: "#222", textAlign: "right" }}
              >
                ₹{value}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: "#dbeafe" }}>
            <td
              style={{ fontWeight: "700", fontSize: "16px", color: "#1e40af" }}
            >
              Total Amount Due
            </td>
            <td
              style={{
                fontWeight: "700",
                fontSize: "16px",
                textAlign: "right",
                color: "#1e40af",
              }}
            >
              ₹{totalAmountDue.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <hr style={{ borderTop: "1px solid #ddd", marginBottom: "24px" }} />

      <div style={{ fontSize: "14px", color: "#444" }}>
        <h3 style={{ fontWeight: "600", marginBottom: "8px" }}>
          Notes/Terms & Conditions:
        </h3>
        <p>{notes}</p>
      </div>

      <p
        style={{
          marginTop: "32px",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: "600",
          color: "#555",
        }}
      >
        Thank you for your business!
      </p>
    </div>
  );
}

export default function InvoiceDownloadButton({ bookingId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); // pdf generation
  const [fetching, setFetching] = useState(false); // data fetch
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const invoiceRef = useRef(null);

  // fetch when modal opens
  useEffect(() => {
    let cancelled = false;
    if (!isOpen) return;

    if (!bookingId) {
      setError("No booking ID provided.");
      return;
    }

    const fetchInvoiceData = async () => {
      setFetching(true);
      setError(null);
      try {
        // First try a dedicated invoice controller (server can return joined data)
        const tryUrls = [
          `/bookings/${bookingId}/invoice`,
          `/bookings/${bookingId}`,
        ];
        let resolved = null;

        for (const url of tryUrls) {
          try {
            const resp = await axios.get(`/invoice/${bookingId}`);

            const payload = resp?.data;
            // normalize: if API returns { data: ... } unwrap
            const candidate = payload?.data ?? payload;
            if (candidate) {
              resolved = candidate;
              break;
            }
          } catch (err) {
            // try next url
            console.warn(
              `Invoice fetch failed for ${url}:`,
              err?.message || err
            );
          }
        }

        if (!cancelled) {
          if (resolved) setBookingData(resolved);
          else {
            setBookingData(null);
            setError("Failed to load invoice data from server.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unexpected fetch error:", err);
          setError("Unexpected error while fetching invoice data.");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchInvoiceData();
    return () => {
      cancelled = true;
    };
  }, [isOpen, bookingId]);

  // accessibility focus trap
  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement;
    const timer = setTimeout(() => {
      const focusable = modalRef.current?.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (focusable) focusable.focus();
    }, 50);

    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      try {
        prevActive?.focus?.();
      } catch (err) {
        console.error("Error restoring focus:", err);
      }
    };
  }, [isOpen]);

  const downloadPdf = async () => {
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      if (!invoiceRef.current) {
        console.error("Invoice DOM not found.");
        setLoading(false);
        return;
      }

      const clone = invoiceRef.current.cloneNode(true);

      clone.querySelectorAll("*").forEach((el) => {
        try {
          const style = window.getComputedStyle(el);
          if (style.color && style.color.includes("oklch"))
            el.style.color = "black";
          if (style.backgroundColor && style.backgroundColor.includes("oklch"))
            el.style.backgroundColor = "white";
          if (style.borderColor && style.borderColor.includes("oklch"))
            el.style.borderColor = "#ccc";
        } catch (err) {
          // ignore
        }
      });

      clone.style.position = "fixed";
      clone.style.top = "-10000px";
      clone.style.left = "-10000px";
      clone.style.zIndex = "-9999";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      document.body.removeChild(clone);

      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);

      const invoiceFilename =
        bookingData?.invoiceNo || `invoice-${Date.now().toString().slice(-6)}`;
      const fileName = `${invoiceFilename}-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-md"
      >
        Generate Invoice
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/40"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-w-4xl w-full mx-auto"
            style={{ outline: "none" }}
          >
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-medium text-gray-800">
                  Invoice Preview
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div
                className="p-6 overflow-y-auto flex-grow flex justify-center"
                style={{ backgroundColor: "#fff" }}
              >
                <div ref={invoiceRef}>
                  {fetching ? (
                    <div className="p-8">Loading invoice data...</div>
                  ) : error ? (
                    <div className="p-6 text-red-600">{error}</div>
                  ) : (
                    <InvoiceContent booking={bookingData || {}} />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none transition-all duration-200 shadow-sm"
                >
                  Close
                </button>
                <button
                  onClick={downloadPdf}
                  className="px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none transition-all duration-200 shadow-md"
                  disabled={loading || fetching || !!error}
                >
                  {loading ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
