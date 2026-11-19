"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Map,
  ShieldAlert,
  Radio,
  ChevronDown,
} from "lucide-react";
import type { CSSProperties } from "react";

const colors = {
  bg: "#0c1117",
  text: "#f4f0e9",
  muted: "#b4bac2",
  accent: "#e7a46f",
};

const features = [
  {
    icon: Map,
    number: "01",
    title: "Community Mapping",
    description:
      "Locate residents, report hazards, and discover safer routes through the Hollow.",
  },
  {
    icon: Activity,
    number: "02",
    title: "DOMINO Intelligence",
    description:
      "Simulate infrastructure failures and compare emergency response strategies.",
  },
  {
    icon: Radio,
    number: "03",
    title: "Emergency Network",
    description:
      "Connect communities and share critical information when infrastructure fails.",
  },
];

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "15px 23px",
  borderRadius: 7,
  background: colors.accent,
  color: "#10151a",
  fontWeight: 750,
  fontSize: 14,
  textDecoration: "none",
};

export default function Home() {
  return (
    <main
      style={{
        background: colors.bg,
        color: colors.text,
        minHeight: "100vh",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* HERO */}
      <section
        style={{
          minHeight: "100svh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          backgroundImage: `
            linear-gradient(90deg,
              rgba(7,11,17,.93) 0%,
              rgba(7,11,17,.67) 43%,
              rgba(7,11,17,.14) 100%),
            linear-gradient(0deg,
              #0c1117 0%,
              transparent 40%),
            url('/hollow-city.png')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* NAVBAR */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
            padding: "22px clamp(20px, 5vw, 80px)",
            borderBottom: "1px solid #ffffff25",
            background: "#0a1017a8",
            backdropFilter: "blur(14px)",
          }}
        >
          <Link
            href="/"
            style={{
              color: "white",
              fontSize: 23,
              fontWeight: 900,
              letterSpacing: -1,
              textDecoration: "none",
            }}
          >
            DAYLIGHT
            <span style={{ color: colors.accent }}> /</span>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              flexWrap: "wrap",
            }}
          >
            <Link href="#mission" style={navLink}>
              Mission
            </Link>
            <Link href="/domino" style={navLink}>
              DOMINO
            </Link>
            <Link href="/auth/login" style={navLink}>
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.06 }}>
              <Link href="/auth/signup" style={buttonStyle}>
                Sign up <ArrowUpRight size={16} />
              </Link>
            </motion.div>
          </div>
        </nav>

        {/* HERO CONTENT */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "90px clamp(22px, 8vw, 130px) 110px",
            maxWidth: 1050,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p
              style={{
                color: colors.accent,
                fontSize: 12,
                letterSpacing: 4,
                fontWeight: 800,
              }}
            >
              THE HOLLOW / YEAR 2087
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 45 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            style={{
              fontSize: "clamp(44px, 7.4vw, 108px)",
              fontWeight: 900,
              letterSpacing: "-0.065em",
              lineHeight: 1.03,
              margin: "28px 0",
            }}
          >
            THE SURFACE
            <br />
            IS LOST.
            <br />
            <span style={{ color: colors.accent }}>HUMANITY ISN&apos;T.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{
              color: "#d0d4d8",
              fontSize: "clamp(16px, 1.6vw, 20px)",
              lineHeight: 1.8,
              maxWidth: 590,
            }}
          >
            Two billion lives beneath the surface. One network connecting them
            all. Monitor threats. Protect communities. Find a way back to the
            world above.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 32,
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/auth/signup" style={buttonStyle}>
                Enter the Hollow <ArrowRight size={18} />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href="/domino"
                style={{
                  ...buttonStyle,
                  background: "#ffffff14",
                  border: "1px solid #ffffff60",
                  color: "white",
                  backdropFilter: "blur(8px)",
                }}
              >
                Explore DOMINO <ArrowUpRight size={18} />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* BOTTOM STATUS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            padding: "22px clamp(20px, 5vw, 80px)",
            borderTop: "1px solid #ffffff30",
            fontSize: 12,
            letterSpacing: 2,
          }}
        >
          <span style={{ color: colors.accent }}>
            <Radio size={14} style={{ display: "inline" }} /> NETWORK SIMULATION
            / ONLINE
          </span>
          <a
            href="#mission"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            SCROLL TO EXPLORE{" "}
            <ChevronDown size={14} style={{ display: "inline" }} />
          </a>
        </div>
      </section>

      {/* MISSION */}
      <section
        id="mission"
        style={{
          padding: "110px clamp(22px, 8vw, 130px)",
          maxWidth: 1600,
          margin: "auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p
            style={{
              color: colors.accent,
              letterSpacing: 3,
              fontSize: 12,
            }}
          >
            01 / OUR PURPOSE
          </p>

          <h2
            style={{
              fontSize: "clamp(34px, 5vw, 64px)",
              letterSpacing: -2,
              margin: "22px 0",
              lineHeight: 1.1,
            }}
          >
            IN THE DARKNESS,
            <br />
            <span style={{ color: colors.accent }}>WE FIND EACH OTHER.</span>
          </h2>

          <p
            style={{
              color: colors.muted,
              fontSize: 18,
              lineHeight: 1.8,
              maxWidth: 720,
            }}
          >
            When infrastructure fails, information saves lives. DAYLIGHT
            connects residents and emergency planners through one unified
            survival network.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 20,
            marginTop: 65,
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.12,
                }}
                whileHover={{
                  y: -10,
                  borderColor: colors.accent,
                  backgroundColor: "#20272e",
                }}
                style={{
                  padding: 32,
                  border: "1px solid #303a43",
                  background: "#151c23",
                  borderRadius: 12,
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: colors.accent,
                  }}
                >
                  <Icon size={30} />
                  <span>{feature.number}</span>
                </div>

                <h3
                  style={{
                    fontSize: 23,
                    marginTop: 35,
                  }}
                >
                  {feature.title}
                </h3>

                <p
                  style={{
                    color: colors.muted,
                    lineHeight: 1.8,
                  }}
                >
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "100px 24px",
          borderTop: "1px solid #303a43",
          background: "linear-gradient(180deg,#111820,#201b19)",
        }}
      >
        <ShieldAlert
          size={36}
          color={colors.accent}
          style={{ marginBottom: 24 }}
        />

        <h2
          style={{
            fontSize: "clamp(32px, 5vw, 58px)",
            marginBottom: 18,
          }}
        >
          THE FUTURE IS UNDERGROUND.
        </h2>

        <p
          style={{
            color: colors.muted,
            marginBottom: 35,
          }}
        >
          Join the network. Every life matters.
        </p>

        <Link href="/auth/signup" style={buttonStyle}>
          Join DAYLIGHT <ArrowUpRight size={18} />
        </Link>
      </section>

      <footer
        style={{
          padding: 28,
          textAlign: "center",
          color: "#89929b",
          fontSize: 12,
        }}
      >
        DAYLIGHT / THE HOLLOW / EST. 2087
      </footer>
    </main>
  );
}

const navLink: CSSProperties = {
  color: "#e6e6e6",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};
