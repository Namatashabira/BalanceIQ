import { useState, useEffect, useRef } from "react";
import { fetchOrders, updateOrderStatus } from "../../api";
import AbandonedCarts from "./AbandonedCarts";

export default function Orders() {
  const tabs = ["Pending", "Confirmed", "Cancelled", "Abandoned Carts"];
  const [activeTab, setActiveTab] = useState("Pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  const loadOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchOrders(activeTab.toLowerCase());
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setOrders([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "Abandoned Carts") {
      loadOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Abandoned Carts") {
      const interval = setInterval(() => loadOrders(false), 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
        {activeTab !== "Abandoned Carts" && (
          <button
            onClick={loadOrders}
            className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Render Abandoned Carts component when that tab is active */}
      {activeTab === "Abandoned Carts" ? (
        <AbandonedCarts />
      ) : (
        <>
          {/* TABLE WRAPPER */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-x-auto overflow-y-auto max-h-[600px]">
            {loading ? (
              <p className="p-3 text-sm">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="p-3 text-sm">
                No {activeTab.toLowerCase()} orders found.
              </p>
            ) : (
              <table className="relative w-full border-collapse text-sm min-w-[1100px] md:min-w-0">
            <thead>
              <tr className="bg-gray-200">
                {/* LEFT FIXED on md+ */}
                <th className="w-[60px] px-2 py-2 border md:sticky md:top-0 md:left-0 md:z-50 bg-gray-200">
                  ID
                </th>
                <th className="w-[220px] px-2 py-2 border md:sticky md:top-0 md:left-[60px] md:z-50 bg-gray-200 md:shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">
                  Customer
                </th>

                {/* SCROLLING MIDDLE */}
                <th className="px-2 py-2 border bg-gray-200 md:sticky md:top-0 md:z-30">
                  Contact
                </th>
                <th className="px-2 py-2 border bg-gray-200 md:sticky md:top-0 md:z-30">
                  Location
                </th>
                <th className="px-2 py-2 border bg-gray-200 md:sticky md:top-0 md:z-30">
                  Type
                </th>
                <th className="px-2 py-2 border bg-gray-200 md:sticky md:top-0 md:z-30">
                  Items
                </th>
                <th className="px-2 py-2 border bg-gray-200 md:sticky md:top-0 md:z-30">
                  Total
                </th>
                <th className="px-2 py-2 border bg-gray-200 md:sticky md:top-0 md:z-30">
                  Date
                </th>

                {/* RIGHT FIXED on md+ */}
                <th className="w-[150px] px-2 py-2 border md:sticky md:top-0 md:right-0 md:z-50 bg-gray-200">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  {/* LEFT FIXED */}
                  <td className="px-2 py-2 border md:sticky md:left-0 md:z-40 bg-white">
                    {order.id}
                  </td>
                  <td className="px-2 py-2 border md:sticky md:left-[60px] md:z-40 bg-white md:shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">
                    <div className="font-medium truncate">{order.customer_name}</div>
                    <div className="text-xs text-gray-500 truncate">{order.customer_email}</div>
                  </td>

                  {/* SCROLLING MIDDLE */}
                  <td className="px-2 py-2 border text-xs">
                    {order.phone_number}
                    <div className="text-gray-500">{order.delivery ? "Delivery" : "Pickup"}</div>
                  </td>
                  <td className="px-2 py-2 border text-xs">{order.location}</td>
                  <td className="px-2 py-2 border">
                    <span
                      className={`px-2 py-[2px] rounded text-xs ${
                        order.order_type === "wholesale"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {order.order_type}
                    </span>
                  </td>
                  <td className="px-2 py-2 border text-xs">
                    {order.items?.length ? (
                      <ul className="list-disc pl-4">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.product_name} (x{item.quantity})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No items"
                    )}
                  </td>
                  <td className="px-2 py-2 border text-xs">{order.total} UGX</td>
                  <td className="px-2 py-2 border text-xs">
                    {new Date(order.date).toLocaleDateString()}
                  </td>

                  {/* RIGHT FIXED */}
                  <td className="px-2 py-2 border md:sticky md:right-0 md:z-40 bg-white">
                    {order.status === "pending" ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(order.id, "confirmed")}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, "cancelled")}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 capitalize text-xs">{order.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500 italic">
        Swipe horizontally on small screens. Scroll vertically if table is long.
      </p>
        </>
      )}
    </div>
  );
}
