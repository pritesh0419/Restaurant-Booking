db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "passwordHash", "role"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        role: { enum: ["customer", "admin"] }
      }
    }
  }
});

db.users.createIndex({ email: 1 }, { unique: true });

db.createCollection("bookings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "customerName",
        "customerEmail",
        "partySize",
        "reservationDate",
        "reservationTime",
        "status",
        "source"
      ],
      properties: {
        customerName: { bsonType: "string" },
        customerEmail: { bsonType: "string" },
        partySize: { bsonType: "int", minimum: 1, maximum: 12 },
        reservationDate: { bsonType: "string" },
        reservationTime: { bsonType: "string" },
        status: { enum: ["pending", "approved", "declined", "cancelled"] },
        source: { enum: ["guest", "registered"] }
      }
    }
  }
});

db.bookings.createIndex({ reservationDate: 1, reservationTime: 1 });
