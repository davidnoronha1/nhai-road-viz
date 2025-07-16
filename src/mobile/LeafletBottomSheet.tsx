"use client"

import React, { useState, Children, isValidElement } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

type SheetState = "collapsed" | "semi" | "expanded"

interface LeafletBottomSheetProps {
  children: React.ReactNode
  className?: string
}

interface DrawerSubComponentProps {
  children: React.ReactNode
  className?: string
}

const Summary = ({ children }: DrawerSubComponentProps) => <div style={{ height: "100%" }}>{children}</div>
const Details = ({ children }: DrawerSubComponentProps) => <div style={{ height: "100%" }}>{children}</div>
const Full = ({ children }: DrawerSubComponentProps) => <div style={{ height: "100%" }}>{children}</div>

function LeafletBottomSheet({ children }: LeafletBottomSheetProps) {
  const [state, setState] = useState<SheetState>("collapsed")

  const getHeight = () => {
    switch (state) {
      case "collapsed":
        return "10vh"
      case "semi":
        return "40vh"
      case "expanded":
        return "100vh"
      default:
        return "10vh"
    }
  }

  const handleToggle = () => {
    setState((prev) => {
      switch (prev) {
        case "collapsed":
          return "semi"
        case "semi":
          return "expanded"
        case "expanded":
          return "collapsed"
        default:
          return "collapsed"
      }
    })
  }

  const handleBackdropClick = () => {
    if (state === "expanded") {
      setState("semi")
    }
  }

  const renderContent = () => {
    const childrenArray = Children.toArray(children)
    let targetComponent = null

    childrenArray.forEach((child) => {
      if (isValidElement(child)) {
        if (state === "collapsed" && child.type === Summary) {
          targetComponent = child
        } else if (state === "semi" && child.type === Details) {
          targetComponent = child
        } else if (state === "expanded" && child.type === Full) {
          targetComponent = child
        }
      }
    })

    return targetComponent || <div>No content for current state</div>
  }

  return (
    <>
      {state === "expanded" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 40,
          }}
          onClick={handleBackdropClick}
        />
      )}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--gray-3)",
          borderTop: "1px solid #ddd",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
          transition: "height 0.3s ease-in-out",
          height: getHeight(),
          display: "flex",
          flexDirection: "column",
          zIndex: 999,
        }}
      >
        <div
          style={{
            padding: "8px 0",
            borderBottom: "1px solid #eee",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f9f9f9",
          }}
          onClick={handleToggle}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "4px",
                backgroundColor: "#ccc",
                borderRadius: "9999px",
              }}
            />
            {state === "expanded" ? (
              <ChevronDown size={16} color="#888" />
            ) : (
              <ChevronUp size={16} color="#888" />
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>{renderContent()}</div>

        <div
          style={{
            position: "absolute",
            top: 4,
            right: 12,
            fontSize: "12px",
            color: "#aaa",
          }}
        >
          {state === "collapsed" && "Summary"}
          {state === "semi" && "Details"}
          {state === "expanded" && "Full"}
        </div>
      </div>
    </>
  )
}

LeafletBottomSheet.Summary = Summary
LeafletBottomSheet.Details = Details
LeafletBottomSheet.Full = Full

export default LeafletBottomSheet
