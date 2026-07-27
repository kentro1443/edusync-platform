import { describe, expect, it } from "vitest";

import {
  MarketplaceStateError,
  MarketplaceValidationError,
  assertNotSelfOffer,
  assertOfferAcceptable,
  assertOfferWithdrawable,
  assertPaymentTransition,
  assertRequestAcceptsOffers,
  assertRequestCancellable,
  totalAmountVnd,
  validateOfferInput,
  validateRequestInput,
} from "@/lib/marketplace/marketplace-domain";

describe("marketplace domain", () => {
  describe("validateRequestInput", () => {
    it("normalises a valid request", () => {
      const result = validateRequestInput({
        title: "  Luyện SAT Math  ",
        description: "Cần cố vấn ôn 5 buổi SAT Math trước kỳ thi tháng 12.",
        preferredSessions: 5,
        budgetHintVnd: 150_000,
      });
      expect(result.title).toBe("Luyện SAT Math");
      expect(result.budgetHintVnd).toBe(150_000);
    });

    it("rejects a short title", () => {
      expect(() =>
        validateRequestInput({
          title: "a",
          description: "mô tả đủ dài để hợp lệ",
          preferredSessions: 1,
        }),
      ).toThrow(MarketplaceValidationError);
    });

    it("rejects an out-of-range session count", () => {
      expect(() =>
        validateRequestInput({
          title: "Tiêu đề hợp lệ",
          description: "mô tả đủ dài để hợp lệ",
          preferredSessions: 0,
        }),
      ).toThrow(MarketplaceValidationError);
    });

    it("treats missing budget as null", () => {
      const result = validateRequestInput({
        title: "Tiêu đề hợp lệ",
        description: "mô tả đủ dài để hợp lệ",
        preferredSessions: 2,
      });
      expect(result.budgetHintVnd).toBeNull();
    });
  });

  describe("validateOfferInput", () => {
    it("accepts a valid offer", () => {
      const result = validateOfferInput({
        pricePerSessionVnd: 120_000,
        message: "Mình từng đạt SAT 1520, có thể kèm bạn 5 buổi.",
      });
      expect(result.pricePerSessionVnd).toBe(120_000);
    });

    it("rejects a price below the minimum", () => {
      expect(() =>
        validateOfferInput({ pricePerSessionVnd: 10, message: "lời nhắn hợp lệ" }),
      ).toThrow(MarketplaceValidationError);
    });

    it("rejects an empty message", () => {
      expect(() =>
        validateOfferInput({ pricePerSessionVnd: 120_000, message: " " }),
      ).toThrow(MarketplaceValidationError);
    });
  });

  describe("state guards", () => {
    it("blocks offers on non-open requests", () => {
      expect(() => assertRequestAcceptsOffers("MATCHED")).toThrow(MarketplaceStateError);
      expect(() => assertRequestAcceptsOffers("OPEN")).not.toThrow();
    });

    it("blocks self offers", () => {
      expect(() => assertNotSelfOffer("user-1", "user-1")).toThrow(MarketplaceStateError);
      expect(() => assertNotSelfOffer("user-1", "user-2")).not.toThrow();
    });

    it("only accepts a pending offer on an open request", () => {
      expect(() => assertOfferAcceptable("OPEN", "PENDING")).not.toThrow();
      expect(() => assertOfferAcceptable("MATCHED", "PENDING")).toThrow(MarketplaceStateError);
      expect(() => assertOfferAcceptable("OPEN", "DECLINED")).toThrow(MarketplaceStateError);
    });

    it("only withdraws pending offers", () => {
      expect(() => assertOfferWithdrawable("PENDING")).not.toThrow();
      expect(() => assertOfferWithdrawable("ACCEPTED")).toThrow(MarketplaceStateError);
    });

    it("only cancels open requests", () => {
      expect(() => assertRequestCancellable("OPEN")).not.toThrow();
      expect(() => assertRequestCancellable("CANCELLED")).toThrow(MarketplaceStateError);
    });
  });

  describe("payment transitions", () => {
    it("allows pending to paid or waived", () => {
      expect(() => assertPaymentTransition("PENDING", "PAID")).not.toThrow();
      expect(() => assertPaymentTransition("PENDING", "WAIVED")).not.toThrow();
    });

    it("blocks changing a settled payment", () => {
      expect(() => assertPaymentTransition("PAID", "PENDING")).toThrow(MarketplaceStateError);
      expect(() => assertPaymentTransition("WAIVED", "PAID")).toThrow(MarketplaceStateError);
    });
  });

  it("computes total amount", () => {
    expect(totalAmountVnd(120_000, 5)).toBe(600_000);
  });
});
