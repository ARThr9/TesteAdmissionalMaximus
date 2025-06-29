import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Clientes.module.css"; // Importa o CSS Module
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
} from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nome");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("ativo", true)
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (error) throw error;
      setClients(data);
    } catch (error) {
      alert("Erro ao carregar clientes: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (client) => {
    try {
      const { nome, cpf_cnpj, email, telefone } = client;

      await supabase
        .from("clientes")
        .insert([{ nome, cpf_cnpj, email, telefone, ativo: true }]);

      await fetchClients();
      setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao adicionar cliente: " + error.message);
    }
  };

  const updateClient = async (updatedClient) => {
    try {
      const { id, nome, cpf_cnpj, email, telefone } = updatedClient;
      await supabase
        .from("clientes")
        .update({ nome, cpf_cnpj, email, telefone })
        .eq("id", id);
      await fetchClients();
      setIsModalOpen(false);
      setCurrentClient(null);
    } catch (error) {
      alert("Erro ao atualizar cliente: " + error.message);
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm("Tem certeza que deseja desativar este cliente?")) {
      try {
        await supabase.from("clientes").update({ ativo: false }).eq("id", id);
        await fetchClients();
      } catch (error) {
        alert("Erro ao desativar cliente: " + error.message);
      }
    }
  };

  const openAddModal = () => {
    setCurrentClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setCurrentClient(client);
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

  const filteredClients = clients.filter(
    (client) =>
      (client.nome &&
        client.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.cpf_cnpj && client.cpf_cnpj.includes(searchTerm)) ||
      (client.email &&
        client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportExcel = () => {
    exportToExcel(filteredClients, "clientes", [
      "id",
      "nome",
      "cpf_cnpj",
      "email",
      "telefone",
    ]);
  };

  const handleExportPDF = () => {
    const headers = [["ID", "Nome", "CPF/CNPJ", "Email", "Telefone"]];
    const data = filteredClients.map((client) => [
      client.id,
      client.nome,
      client.cpf_cnpj,
      client.email,
      client.telefone,
    ]);
    exportToPDF(headers, data, "clientes");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Gestão de Clientes</h2>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={openAddModal} className={styles.addButton}>
          <PlusCircle size={18} /> Adicionar Cliente
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
              <th className={styles.th} onClick={() => handleSort("nome")}>
                <div className={styles.sortableHeaderContent}>
                  Nome{" "}
                  {sortBy === "nome" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th} onClick={() => handleSort("cpf_cnpj")}>
                <div className={styles.sortableHeaderContent}>
                  CPF/CNPJ{" "}
                  {sortBy === "cpf_cnpj" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th} onClick={() => handleSort("email")}>
                <div className={styles.sortableHeaderContent}>
                  Email{" "}
                  {sortBy === "email" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th}>Telefone</th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td className={styles.td}>{client.nome}</td>
                  <td className={styles.td}>{client.cpf_cnpj}</td>
                  <td className={styles.td}>{client.email}</td>
                  <td className={styles.td}>{client.telefone}</td>
                  <td className={styles.tdActions}>
                    <button
                      onClick={() => openEditModal(client)}
                      className={styles.actionButton}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
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
        <ClientFormModal
          client={currentClient}
          onSave={currentClient ? updateClient : addClient}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ClientFormModal({ client, onSave, onClose }) {
  const [formData, setFormData] = useState(
    client || { nome: "", cpf_cnpj: "", email: "", telefone: "" }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      alert("Por favor, preencha pelo menos o nome e o email.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>{client ? "Editar Cliente" : "Adicionar Cliente"}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome:</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>CPF/CNPJ:</label>
            <input
              type="text"
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Telefone:</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.modalActions}>
            <button
              type="submit"
              className={`${styles.addButton} ${styles.modalSaveButton}`}
            >
              <Save size={18} /> {client ? "Salvar Edição" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.exportButton} ${styles.modalCancelButton}`}
            >
              <XCircle size={18} /> Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
