import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

import { useAuth } from "./AuthContext"; // Adjust the path as necessary
const Creations = ({
  inquiries,
}) => {
  const [showOneTimeCleaningForm, setShowOneTimeCleaningForm] = useState(false);
  const { token } = useAuth();
  const handleInquiryChange = (selectedOption) => {
    setNewRecurringPayment({
      ...newRecurringPayment,
      inquiry_id: selectedOption ? selectedOption.value : "",
    });
  };
  
  const inquiryOptions = inquiries.map((inquiry) => ({
    value: inquiry.id,
    label: inquiry.name,
  }));
  
  const inquiryOptions2 = inquiries.map((inquiry) => ({
    value: inquiry.id,
    label: inquiry.name,
  }));
  
  
  const [showRecurringPaymentForm, setShowRecurringPaymentForm] = useState(false);
  const [recurringPaid, setRecurringPaid] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const createRecurringPaid = async () => {
    try {
      const response = await axios.post(
        "/api/recurring_paid",
        {
          ...newRecurringPaid,
          dates_related: newRecurringPaid.dates_related.join(", "), // Convert dates to a comma-separated string
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRecurringPaid((prev) => [...prev, response.data.recurring_paid]);
      setNewRecurringPaid({
        recurring_payment_id: "",
        dates_related: [],
        amount_paid: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to create recurring paid record:", err);
    }
  };

  useEffect(() => {
    const fetchRecurringPayments = async () => {
      try {
        const response = await axios.get("/api/recurring_payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecurringPayments(response.data); // Populate state with fetched data
      } catch (err) {
        console.error("Failed to fetch recurring payments:", err);
      }
    };
  
    fetchRecurringPayments();
  }, [token]);
  


  const [oneTimeCleanings, setOneTimeCleanings] = useState([]);

  const createRecurringPayment = async () => {
    try {
      const response = await axios.post(
        "/api/recurring_payments",
        newRecurringPayment,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRecurringPayments((prev) => [
        ...prev,
        response.data.recurring_payment,
      ]);
      setNewRecurringPayment({
        inquiry_id: "",
        amount: "",
        frequency: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to create recurring payment:", err);
    }
  };

  const [showRecurringPaidForm, setShowRecurringPaidForm] = useState(false);
const applyDiscount = (setter, field, discount) => {
  setter((prev) => ({
    ...prev,
    [field]: (prev[field] * discount).toFixed(2),
  }));
};
const createOneTimeCleaning = async () => {
  try {
    const response = await axios.post(
      "/api/one_time_cleanings",
      newCleaning,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setOneTimeCleanings((prev) => [...prev, response.data.one_time_cleaning]);
    setNewCleaning({
      inquiry_id: "",
      date_time: "",
      amount: "",
      paid: false,
    });
  } catch (err) {
    console.error("Failed to create one-time cleaning:", err);
  }
};
  const [newCleaning, setNewCleaning] = useState({
    inquiry_id: "",
    date_time: "",
    amount: "",
    paid: false,
  });

  const [newRecurringPayment, setNewRecurringPayment] = useState({
    inquiry_id: "",
    amount: "",
    frequency: "",
    notes: "",
  });

  const [newRecurringPaid, setNewRecurringPaid] = useState({
    recurring_payment_id: "",
    dates_related: [],
    amount_paid: "",
    notes: "",
  });

  const addDate = () => {
    setNewRecurringPaid((prev) => ({
      ...prev,
      dates_related: [...prev.dates_related, ""],
    }));
  };

  const removeDate = (index) => {
    setNewRecurringPaid((prev) => {
      const updatedDates = [...prev.dates_related];
      updatedDates.splice(index, 1);
      return { ...prev, dates_related: updatedDates };
    });
  };

  const updateDate = (index, value) => {
    setNewRecurringPaid((prev) => {
      const updatedDates = [...prev.dates_related];
      updatedDates[index] = value;
      return { ...prev, dates_related: updatedDates };
    });
  };

  const recurringPaymentOptions = recurringPayments.map((payment) => ({
    value: payment.id,
    label: payment.inquiry_name,
  }));

  return (
    <div>
      {/* Create One-Time Cleaning Form */}
      
      <div className="relative py-8 bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg p-5 max-w-4xl mx-auto mt-6">
  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 opacity-50 rounded-lg"></div>
  <div className="relative z-10">
    <button
      onClick={() => setShowOneTimeCleaningForm((prev) => !prev)}
      className="text-2xl font-extrabold mb-4 text-center block w-full text-white tracking-wide drop-shadow-md hover:underline font-[Poppins]"
    >
      {showOneTimeCleaningForm
        ? "Hide One-Time Cleaning Form"
        : "Create One-Time Cleaning"}
    </button>
        {showOneTimeCleaningForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createOneTimeCleaning(newCleaning); 
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
<Select
  options={inquiryOptions2}
  onChange={(selectedOption) =>
    setNewCleaning({
      ...newCleaning,
      inquiry_id: selectedOption ? selectedOption.value : "",
    })
  }
  value={inquiryOptions.find(
    (option) => option.value === newCleaning.inquiry_id
  )}
  placeholder="Select an Inquiry"
  classNamePrefix="react-select"
  className="w-full"
  isSearchable
/>
            <input
              type="datetime-local"
              value={newCleaning.date_time}
              onChange={(e) =>
                setNewCleaning({
                  ...newCleaning,
                  date_time: e.target.value,
                })
              }
              className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Enter Amount"
              value={newCleaning.amount}
              onChange={(e) =>
                setNewCleaning({
                  ...newCleaning,
                  amount: e.target.value,
                })
              }
              className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => applyDiscount(setNewCleaning, "amount", 0.9)}
                className="bg-blue-500 text-white py-2 px-4 rounded shadow-sm hover:bg-blue-600"
              >
                10% Off
              </button>
              <button
                type="button"
                onClick={() => applyDiscount(setNewCleaning, "amount", 0.85)}
                className="bg-yellow-500 text-white py-2 px-4 rounded shadow-sm hover:bg-green-600"
              >
                15% Off
              </button>
              <button
                type="button"
                onClick={() => applyDiscount(setNewCleaning, "amount", 0.7)}
                className="bg-red-500 text-white py-2 px-4 rounded shadow-sm hover:bg-red-600"
              >
                30% Off
              </button>
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={newCleaning.notes}
              onChange={(e) =>
                setNewCleaning({
                  ...newCleaning,
                  notes: e.target.value,
                })
              }
              className="block w-full md:col-span-2 lg:col-span-3 p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newCleaning.paid}
                onChange={(e) =>
                  setNewCleaning({
                    ...newCleaning,
                    paid: e.target.checked,
                  })
                }
                className="form-checkbox h-5 w-5"
              />
              <label className="text-gray-700">Paid</label>
            </div>
            <button
              type="submit"
              className="block w-full bg-blue-500 text-white py-2 px-4 rounded shadow-sm hover:bg-blue-600 md:col-span-2 lg:col-span-3"
            >
              Create Cleaning
            </button>
          </form>
        )}
      </div>
      </div>

              {/* Create Recurring Payment Schedule Form */}
              <div className="relative py-8 bg-opacity-80 backdrop-blur-lg p-5 rounded-lg shadow-lg max-w-4xl mx-auto mt-6">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-50 rounded-lg"></div>
  <div className="relative z-10">
    <button
      onClick={() => setShowRecurringPaymentForm((prev) => !prev)}
      className="text-2xl font-extrabold mb-4 text-center block w-full text-white tracking-wide drop-shadow-md hover:underline font-[Poppins]"
    >
      {showRecurringPaymentForm
        ? "Hide Recurring Payment Schedule Form"
        : "Create Recurring Payment Schedule"}
    </button>

    {/* Form content should also be inside the same relative container */}
    {showRecurringPaymentForm && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createRecurringPayment();
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
<Select
  options={inquiryOptions}
  onChange={(selectedOption) =>
    setNewRecurringPayment({
      ...newRecurringPayment,
      inquiry_id: selectedOption ? selectedOption.value : "",
    })
  }
  value={inquiryOptions.find(
    (option) => option.value === newRecurringPayment.inquiry_id
  )}
  placeholder="Select an Inquiry"
  classNamePrefix="react-select"
  className="w-full"
  isSearchable
/>;
        <input
          type="number"
          placeholder="Amount"
          value={newRecurringPayment.amount}
          onChange={(e) =>
            setNewRecurringPayment({
              ...newRecurringPayment,
              amount: e.target.value,
            })
          }
          className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Frequency (e.g., Weekly, Monthly)"
          value={newRecurringPayment.frequency}
          onChange={(e) =>
            setNewRecurringPayment({
              ...newRecurringPayment,
              frequency: e.target.value,
            })
          }
          className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Notes (optional)"
          value={newRecurringPayment.notes}
          onChange={(e) =>
            setNewRecurringPayment({
              ...newRecurringPayment,
              notes: e.target.value,
            })
          }
          className="block w-full md:col-span-2 lg:col-span-3 p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <button
          type="submit"
          className="block w-full bg-blue-500 text-white py-2 px-4 rounded shadow-sm hover:bg-blue-600 md:col-span-2 lg:col-span-3"
        >
          Create Recurring Payment Schedule
        </button>
      </form>
    )}
  </div>
</div>

              {/* Create Recurring Paid Record Form */}
              <div className="relative py-8 p-5 bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg max-w-4xl mx-auto  mt-6">
  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-600 opacity-50 rounded-lg"></div>
  <div className="relative z-10">
    <button
      onClick={() => setShowRecurringPaidForm((prev) => !prev)}
      className="text-2xl font-extrabold mb-4 text-center block w-full text-white tracking-wide drop-shadow-md hover:underline font-[Poppins]"
    >
      {showRecurringPaidForm
        ? "Hide Recurring Paid Record Form"
        : "Create Recurring Paid Record"}
    </button>

    {showRecurringPaidForm && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createRecurringPaid();
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5"
      >
<Select
  options={recurringPaymentOptions}
  onChange={(selectedOption) => {
    setNewRecurringPaid({
      ...newRecurringPaid,
      recurring_payment_id: selectedOption ? selectedOption.value : "",
    });
  }}
  value={recurringPaymentOptions.find(
    (option) => option.value === newRecurringPaid.recurring_payment_id
  )}
  placeholder="Select Client for Payment"
  classNamePrefix="react-select"
  className="w-full"
  isSearchable
/>

        {newRecurringPaid.dates_related.map((date, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => updateDate(index, e.target.value)}
              className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeDate(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addDate}
          className="block w-56 bg-green-500 text-white py-2 px-4 rounded shadow-sm hover:bg-green-600 md:col-span-2 lg:col-span-3"
        >
          Add Date
        </button>

        <div className="w-full">
          <label className="block text-gray-700 font-semibold mb-2">
            Amount Paid:
          </label>
          <input
            type="number"
            placeholder="Enter Amount"
            value={newRecurringPaid.amount_paid}
            onChange={(e) =>
              setNewRecurringPaid({
                ...newRecurringPaid,
                amount_paid: e.target.value,
              })
            }
            className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              setNewRecurringPaid((prev) => ({
                ...prev,
                amount_paid: (prev.amount_paid * 0.9).toFixed(2),
              }))
            }
            className="bg-blue-500 text-white py-2 px-4 rounded shadow-sm hover:bg-blue-600"
          >
            10% Off
          </button>
          <button
            type="button"
            onClick={() =>
              setNewRecurringPaid((prev) => ({
                ...prev,
                amount_paid: (prev.amount_paid * 0.85).toFixed(2),
              }))
            }
            className="bg-green-500 text-white py-2 px-4 rounded shadow-sm hover:bg-green-600"
          >
            15% Off
          </button>
          <button
            type="button"
            onClick={() =>
              setNewRecurringPaid((prev) => ({
                ...prev,
                amount_paid: (prev.amount_paid * 0.7).toFixed(2),
              }))
            }
            className="bg-red-500 text-white py-2 px-4 rounded shadow-sm hover:bg-red-600"
          >
            30% Off
          </button>
        </div>

        <textarea
          placeholder="Notes (optional)"
          value={newRecurringPaid.notes}
          onChange={(e) =>
            setNewRecurringPaid({
              ...newRecurringPaid,
              notes: e.target.value,
            })
          }
          className="block w-full md:col-span-2 lg:col-span-3 p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <button
          type="submit"
          className="block w-full bg-blue-500 text-white py-2 px-4 rounded shadow-sm hover:bg-blue-600 md:col-span-2 lg:col-span-3"
        >
          Create Recurring Paid Record
        </button>
      </form>
    )}
  </div>
</div>


    </div>
  );
};

export default Creations;
