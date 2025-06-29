import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Pedidos.module.css"; // Importa o arquivo CSS Module
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  File,
  XCircle,
  Save,
  ChevronUp,
  ChevronDown,
  MinusCircle,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

export default function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from("pedidos")
        .select("*, clientes (id, nome)")
        .order(sortBy, { ascending: sortOrder === "asc" });
      if (ordersError) throw ordersError;

      const orderIds = ordersData.map((o) => o.id);
      if (orderIds.length === 0) {
        setOrders([]);

        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("pedido_itens")
        .select("*, produtos (id, nome, preco)")
        .in("pedido_id", orderIds);
      if (itemsError) throw itemsError;

      const itemsByOrderId = itemsData.reduce((acc, item) => {
        if (!acc[item.pedido_id]) {
          acc[item.pedido_id] = [];
        }
        acc[item.pedido_id].push(item);
        return acc;
      }, {});

      const combinedOrders = ordersData.map((order) => ({
        ...order,
        itens: itemsByOrderId[order.id] || [],
      }));
      setOrders(combinedOrders);
    } catch (error) {
      alert("Erro ao carregar pedidos: " + error.message);
    } finally {
      setLoading(false); // O loading finaliza aqui, após todas as buscas
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    async function fetchPageData() {
      setLoading(true);
      try {
        // 1. Busca apenas CLIENTES ATIVOS para o formulário
        const { data: clientsData, error: clientsError } = await supabase
          .from("clientes")
          .select("*")
          .eq("ativo", true);
        if (clientsError) throw clientsError;
        setClients(clientsData);

        // 2. Busca apenas PRODUTOS ATIVOS para o formulário
        const { data: productsData, error: productsError } = await supabase
          .from("produtos")
          .select("*")
          .eq("ativo", true);
        if (productsError) throw productsError;
        setProducts(productsData);

        // 3. Busca os pedidos
        const { data: ordersData, error: ordersError } = await supabase
          .from("pedidos")
          .select("*, clientes (id, nome)")
          .order("created_at", { ascending: "desc" }); // Padrão inicial
        if (ordersError) throw ordersError;

        const orderIds = ordersData.map((o) => o.id);
        if (orderIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("pedido_itens")
            .select("*, produtos (id, nome, preco)")
            .in("pedido_id", orderIds);
          if (itemsError) throw itemsError;

          const itemsByOrderId = itemsData.reduce((acc, item) => {
            if (!acc[item.pedido_id]) acc[item.pedido_id] = [];
            acc[item.pedido_id].push(item);
            return acc;
          }, {});

          const combinedOrders = ordersData.map((order) => ({
            ...order,
            itens: itemsByOrderId[order.id] || [],
          }));
          setOrders(combinedOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        alert("Erro ao carregar dados da página: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPageData();
  }, []); // Roda apenas uma vez ao carregar a página

  const refreshOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (orderData) => {
    try {
      const { cliente_id, valor_total, itens, created_at } = orderData;
      const { data: newOrder, error: orderError } = await supabase
        .from("pedidos")
        .insert({ cliente_id, valor_total, status: "Pendente", created_at })
        .select()
        .single();
      if (orderError) throw orderError;

      const itemsToInsert = itens.map((item) => ({
        pedido_id: newOrder.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_no_momento: item.preco_no_momento,
      }));

      await supabase.from("pedido_itens").insert(itemsToInsert);
      await refreshOrders(); // Atualiza a lista de pedidos
      setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao adicionar pedido: " + error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Tem certeza que deseja deletar este pedido?")) {
      try {
        await supabase.from("pedido_itens").delete().eq("pedido_id", orderId);
        await supabase.from("pedidos").delete().eq("id", orderId);
        await refreshOrders(); // Atualiza a lista de pedidos
      } catch (error) {
        alert("Erro ao deletar pedido: " + error.message);
      }
    }
  };

  const updateOrder = async (updatedOrderData) => {
    try {
      const { id, cliente_id, valor_total, itens, created_at } =
        updatedOrderData;
      await supabase
        .from("pedidos")
        .update({ cliente_id, valor_total, created_at })
        .eq("id", id);
      await supabase.from("pedido_itens").delete().eq("pedido_id", id);

      const itemsToInsert = itens.map((item) => ({
        pedido_id: id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_no_momento: item.preco_no_momento,
      }));

      if (itemsToInsert.length > 0) {
        await supabase.from("pedido_itens").insert(itemsToInsert);
      }

      await refreshOrders(); // Atualiza a lista de pedidos
      setIsModalOpen(false);
      setCurrentOrder(null);
    } catch (error) {
      alert("Erro ao atualizar pedido: " + error.message);
    }
  };

  const openAddModal = () => {
    setCurrentOrder(null);
    setIsModalOpen(true);
  };
  const openEditModal = (order) => {
    setCurrentOrder(order);
    setIsModalOpen(true);
  };
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!order.clientes) return false;
    const clientName = order.clientes.nome.toLowerCase();
    const orderProducts = order.itens
      .map((item) => (item.produtos ? item.produtos.nome.toLowerCase() : ""))
      .join(", ");
    const orderDate = new Date(order.created_at).toLocaleDateString("pt-BR");
    return (
      clientName.includes(searchTerm.toLowerCase()) ||
      orderProducts.includes(searchTerm.toLowerCase()) ||
      orderDate.includes(searchTerm)
    );
  });

  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map((order) => ({
      ID: order.id,
      Cliente: order.clientes.nome,
      Data: new Date(order.created_at).toLocaleDateString("pt-BR"),
      Produtos: order.itens
        .map((item) => `${item.produtos.nome} (${item.quantidade})`)
        .join("; "),
      Total: order.valor_total.toFixed(2),
    }));
    exportToExcel(dataToExport, "pedidos", [
      "ID",
      "Cliente",
      "Data",
      "Produtos",
      "Total",
    ]);
  };

  const handleExportPDF = () => {
    const headers = [["ID", "Cliente", "Data", "Produtos", "Total"]];
    const data = filteredOrders.map((order) => [
      order.id,
      order.clientes.nome,
      new Date(order.created_at).toLocaleDateString("pt-BR"),
      order.itens
        .map((item) => `${item.produtos.nome} (${item.quantidade})`)
        .join("; "),
      `R$ ${order.valor_total.toFixed(2)}`,
    ]);
    exportToPDF(headers, data, "pedidos");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Gestão de Pedidos</h2>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Buscar pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={openAddModal} className={styles.addButton}>
          <PlusCircle size={18} /> Adicionar Pedido
        </button>
        <button onClick={handleExportExcel} className={styles.exportButton}>
          <FileText size={18} /> Exportar Excel
        </button>
        <button onClick={handleExportPDF} className={styles.exportButton}>
          <File size={18} /> Exportar PDF
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort("id")}>
                <div className={styles.sortableHeaderContent}>
                  ID{" "}
                  {sortBy === "id" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th
                className={styles.th}
                onClick={() => handleSort("cliente_id")}
              >
                <div className={styles.sortableHeaderContent}>
                  Cliente{" "}
                  {sortBy === "cliente_id" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th
                className={styles.th}
                onClick={() => handleSort("created_at")}
              >
                <div className={styles.sortableHeaderContent}>
                  Data{" "}
                  {sortBy === "created_at" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th}>Produtos</th>
              <th
                className={styles.th}
                onClick={() => handleSort("valor_total")}
              >
                <div className={styles.sortableHeaderContent}>
                  Total{" "}
                  {sortBy === "valor_total" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.td}>{order.id}</td>
                  <td className={styles.td}>
                    {order.clientes ? order.clientes.nome : "Cliente Removido"}
                  </td>
                  <td className={styles.td}>
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={styles.td}>
                    {order.itens
                      .map((item) =>
                        item.produtos
                          ? `${item.produtos.nome} (${item.quantidade})`
                          : `Produto Removido (${item.quantidade})`
                      )
                      .join(", ")}
                  </td>
                  <td className={styles.td}>
                    {order.valor_total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className={styles.tdActions}>
                    <button
                      onClick={() => openEditModal(order)}
                      className={styles.actionButton}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <OrderFormModal
          order={currentOrder}
          onSave={currentOrder ? updateOrder : addOrder}
          onClose={() => setIsModalOpen(false)}
          clients={clients}
          products={products}
        />
      )}
    </div>
  );
}

function OrderFormModal({ order, onSave, onClose, clients, products }) {
  const [formData, setFormData] = useState(
    order
      ? {
          id: order.id,
          cliente_id: order.clientes ? order.clientes.id : "",
          created_at: order.created_at,
          itens: order.itens.map((item) => ({
            produto_id: item.produtos ? item.produtos.id : "",
            quantidade: item.quantidade,
            preco_no_momento: item.preco_no_momento,
          })),
          valor_total: order.valor_total,
        }
      : {
          cliente_id: "",
          created_at: new Date().toISOString().split("T")[0],
          itens: [],
          valor_total: 0,
        }
  );

  useEffect(() => {
    const calculatedTotal = formData.itens.reduce((sum, item) => {
      const product = products.find((p) => p.id === Number(item.produto_id));
      return sum + (product ? product.preco * item.quantidade : 0);
    }, 0);
    setFormData((prev) => ({
      ...prev,
      valor_total: parseFloat(calculatedTotal.toFixed(2)),
    }));
  }, [formData.itens, products]);

  const handleItemChange = (index, field, value) => {
    const updatedItens = formData.itens.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, [field]: value };
        if (field === "produto_id") {
          const product = products.find((p) => p.id === Number(value));
          newItem.preco_no_momento = product ? product.preco : 0;
        }
        return newItem;
      }
      return item;
    });
    setFormData({ ...formData, itens: updatedItens });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      itens: [
        ...formData.itens,
        { produto_id: "", quantidade: 1, preco_no_momento: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItens = formData.itens.filter((_, i) => i !== index);
    setFormData({ ...formData, itens: updatedItens });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cliente_id || formData.itens.length === 0) {
      alert(
        "Por favor, selecione um cliente e adicione pelo menos um produto."
      );
      return;
    }
    if (
      formData.itens.some((item) => !item.produto_id || item.quantidade <= 0)
    ) {
      alert("Por favor, verifique os produtos e quantidades.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>{order ? "Editar Pedido" : "Adicionar Pedido"}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Cliente:</label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={(e) =>
                setFormData({ ...formData, cliente_id: Number(e.target.value) })
              }
              className={styles.inputField}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Data do Pedido:</label>
            <input
              type="date"
              name="data"
              value={new Date(formData.created_at).toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({ ...formData, created_at: e.target.value })
              }
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <h4>Itens do Pedido:</h4>
            {formData.itens.map((item, index) => (
              <div key={index} className={styles.orderItem}>
                <select
                  value={item.produto_id}
                  onChange={(e) =>
                    handleItemChange(index, "produto_id", e.target.value)
                  }
                  className={styles.inputField}
                  style={{ flexGrow: 1 }}
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nome} - R$ {product.preco.toFixed(2)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.quantidade}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "quantidade",
                      parseInt(e.target.value) || 0
                    )
                  }
                  min="1"
                  className={styles.quantityInput}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  style={{ padding: "5px" }}
                >
                  <MinusCircle size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddItem}
              className={`${styles.addButton} ${styles.addItemButton}`}
            >
              <PlusCircle size={16} /> Adicionar Item
            </button>
          </div>
          <div className={styles.formGroup}>
            <label>Total do Pedido:</label>
            <input
              type="text"
              value={formData.valor_total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              readOnly
              className={styles.inputField}
              style={{ backgroundColor: "#e9ecef" }}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.addButton}>
              <Save size={18} /> {order ? "Salvar Edição" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.exportButton}
              style={{ background: "#6c757d" }}
            >
              <XCircle size={18} /> Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
