import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Dashboard.module.css"; // Importa o arquivo CSS Module
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  BarChart2,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [ultimosPedidos, setUltimosPedidos] = useState([]);
  const [salesGrowth, setSalesGrowth] = useState("0%");
  const [topProduct, setTopProduct] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const [
          produtosCount,
          clientesCount,
          pedidosData,
          pedidoItensData,
          produtosData,
        ] = await Promise.all([
          supabase.from("produtos").select("*", { count: "exact", head: true }),
          supabase.from("clientes").select("*", { count: "exact", head: true }),
          supabase.from("pedidos").select("valor_total, created_at"),
          supabase.from("pedido_itens").select("produto_id, quantidade"),
          supabase.from("produtos").select("id, nome"),
        ]);

        if (produtosCount.error) throw produtosCount.error;
        setTotalProdutos(produtosCount.count);

        if (clientesCount.error) throw clientesCount.error;
        setTotalClientes(clientesCount.count);

        if (pedidosData.error) throw pedidosData.error;
        setTotalPedidos(pedidosData.data.length);
        const vendasSum = pedidosData.data.reduce(
          (sum, pedido) => sum + pedido.valor_total,
          0
        );
        setTotalVendas(vendasSum);

        const { data: recentesData, error: recentesError } = await supabase
          .from("pedidos")
          .select("id, created_at, valor_total, clientes ( nome )")
          .order("created_at", { ascending: false })
          .limit(5);
        if (recentesError) throw recentesError;
        setUltimosPedidos(recentesData);

        if (pedidoItensData.error) throw pedidoItensData.error;
        if (produtosData.error) throw produtosData.error;

        const productQuantities = {};
        pedidoItensData.data.forEach((item) => {
          productQuantities[item.produto_id] =
            (productQuantities[item.produto_id] || 0) + item.quantidade;
        });

        let maxQuantity = 0;
        let mostSoldProductId = null;
        for (const productId in productQuantities) {
          if (productQuantities[productId] > maxQuantity) {
            maxQuantity = productQuantities[productId];
            mostSoldProductId = productId;
          }
        }

        if (mostSoldProductId) {
          const topProductInfo = produtosData.data.find(
            (p) => p.id === Number(mostSoldProductId)
          );
          setTopProduct(
            topProductInfo ? topProductInfo.nome : "Não encontrado"
          );
        } else {
          setTopProduct("Nenhum");
        }

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        let previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthSales = pedidosData.data
          .filter((order) => {
            const orderDate = new Date(order.created_at);
            return (
              orderDate.getMonth() === currentMonth &&
              orderDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, order) => sum + order.valor_total, 0);

        const previousMonthSales = pedidosData.data
          .filter((order) => {
            const orderDate = new Date(order.created_at);
            return (
              orderDate.getMonth() === previousMonth &&
              orderDate.getFullYear() === previousYear
            );
          })
          .reduce((sum, order) => sum + order.valor_total, 0);

        if (previousMonthSales > 0) {
          const growth = (
            ((currentMonthSales - previousMonthSales) / previousMonthSales) *
            100
          ).toFixed(2);
          setSalesGrowth(`${growth}%`);
        } else {
          setSalesGrowth(currentMonthSales > 0 ? "Novo!" : "0.00%");
        }
      } catch (error) {
        alert("Erro ao carregar dados do dashboard: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const companySummary = {
    name: "Mercado CompreBem",
    mission:
      "Oferecer produtos de qualidade com preços acessíveis, promovendo conveniência e um atendimento humanizado para todos os nossos clientes.",
    vision:
      "Ser referência no bairro como o mercado preferido dos clientes, reconhecido pela variedade, bom atendimento e compromisso com a satisfação.",
    values: [
      "Atendimento com respeito e cordialidade",
      "Compromisso com a qualidade",
      "Preços justos para todos",
      "Transparência e honestidade",
      "Valorização da comunidade local",
      "Agilidade e praticidade no atendimento",
    ],
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Dashboard Principal</h2>
      <p className={styles.welcomeText}>
        Bem-vindo ao painel de controle do sistema de mercado. Aqui você
        encontra os principais indicadores e resumos.
      </p>
      <div className={styles.cardsContainer}>
        <div className={styles.card}>
          <Package size={24} color="#28a745" />
          <h4>Total de Produtos</h4>
          <p className={styles.cardValue}>{totalProdutos}</p>
        </div>
        <div className={styles.card}>
          <Users size={24} color="#007bff" />
          <h4>Total de Clientes</h4>
          <p className={styles.cardValue}>{totalClientes}</p>
        </div>
        <div className={styles.card}>
          <ShoppingCart size={24} color="#ffc107" />
          <h4>Total de Pedidos</h4>
          <p className={styles.cardValue}>{totalPedidos}</p>
        </div>
        <div className={styles.card}>
          <DollarSign size={24} color="#dc3545" />
          <h4>Total de Vendas</h4>
          <p className={styles.cardValue}>
            {totalVendas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>
      <div className={styles.section}>
        <h3>Visão Geral de Vendas</h3>
        <div className={styles.salesSummaryGrid}>
          <div className={styles.salesMetric}>
            <BarChart2 size={20} color="#6f42c1" />
            <span>Crescimento Mês a Mês:</span>
            <strong
              className={
                salesGrowth.includes("-") ? styles.negative : styles.positive
              }
            >
              {salesGrowth}
            </strong>
          </div>
          <div className={styles.salesMetric}>
            <TrendingUp size={20} color="#fd7e14" />
            <span>Produto Mais Vendido:</span>
            <strong>{topProduct}</strong>
          </div>
        </div>
        <h4>Últimos Pedidos Recentes:</h4>
        <ul className={styles.recentOrdersList}>
          {ultimosPedidos.map((order) => (
            <li key={order.id} className={styles.recentOrderItem}>
              Cliente:{" "}
              {order.clientes ? order.clientes.nome : "Cliente não encontrado"}{" "}
              - Data: {new Date(order.created_at).toLocaleDateString("pt-BR")} -
              Total:{" "}
              <span style={{ fontWeight: "bold" }}>
                {order.valor_total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </li>
          ))}
          {ultimosPedidos.length === 0 && <p>Nenhum pedido recente.</p>}
        </ul>
      </div>
      <div className={styles.section}>
        <h3>Sobre o {companySummary.name}</h3>
        <p className={styles.companyText}>{companySummary.mission}</p>
        <p className={styles.companyText}>{companySummary.vision}</p>
        <h4>Nossos Valores:</h4>
        <ul className={styles.valuesList}>
          {companySummary.values.map((value, index) => (
            <li key={index} className={styles.valueItem}>
              {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
