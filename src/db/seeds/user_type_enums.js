// /**
//  * Seeds the user_type_enums lookup table.
//  *
//  * Table columns (no priority, no is_system):
//  *   id, name, display_name, description, is_active, created_at, updated_at
//  *
//  * Safe to re-run any number of times:
//  *   - Existing rows get display_name/description updated (id preserved → FKs stay valid)
//  *   - Missing rows get inserted
//  *   - is_active is never overridden (respects admin's soft-disable)
//  *   - Wrapped in a transaction — any failure rolls back cleanly
//  *   - Handles race conditions via unique-constraint catch
//  */

// const SYSTEM_USER_TYPES = [
//   {
//     name: "admin",
//     display_name: "Administrator",
//     description: "Full system access",
//   },
//   {
//     name: "operations",
//     display_name: "Operations Team",
//     description: "Manage content, users, and dashboard",
//   },
//   {
//     name: "editor",
//     display_name: "Editor",
//     description: "Edit and publish content",
//   },
//   {
//     name: "author",
//     display_name: "Author",
//     description: "Create and edit own content",
//   },
//   {
//     name: "subscriber",
//     display_name: "Subscriber",
//     description: "Read-only access to published content",
//   },
// ];

// exports.seed = async function seed(knex) {
//   const stats = { inserted: 0, updated: 0, unchanged: 0, inactive: [] };

//   await knex.transaction(async (trx) => {
//     for (const type of SYSTEM_USER_TYPES) {
//       const existing = await trx("user_type_enums")
//         .where({ name: type.name })
//         .first();

//       // ── Insert if missing ─────────────────────────────
//       if (!existing) {
//         try {
//           await trx("user_type_enums").insert({
//             name: type.name,
//             display_name: type.display_name,
//             description: type.description,
//             is_active: true,
//             created_at: trx.fn.now(),
//             updated_at: trx.fn.now(),
//           });
//           stats.inserted++;
//         } catch (err) {
//           // Race: another process inserted between SELECT and INSERT.
//           // Unique on `name` caught it — fall back to UPDATE.
//           if (err.code === "23505") {
//             await trx("user_type_enums").where({ name: type.name }).update({
//               display_name: type.display_name,
//               description: type.description,
//               updated_at: trx.fn.now(),
//             });
//             stats.updated++;
//           } else {
//             throw err; // unexpected — roll back the whole transaction
//           }
//         }
//         continue;
//       }

//       // ── Row exists — update only if fields drifted ────
//       const descChanged =
//         (existing.description || null) !== (type.description || null);
//       const nameChanged = existing.display_name !== type.display_name;

//       if (descChanged || nameChanged) {
//         await trx("user_type_enums").where({ id: existing.id }).update({
//           display_name: type.display_name,
//           description: type.description,
//           updated_at: trx.fn.now(),
//         });
//         stats.updated++;
//       } else {
//         stats.unchanged++;
//       }

//       // ── Never touch is_active, but track it for the log ──
//       if (existing.is_active === false) {
//         stats.inactive.push(type.name);
//       }
//     }
//   });

//   // ── Summary ─────────────────────────────────────────────
//   console.log(
//     `[seed] user_type_enums — ` +
//       `inserted: ${stats.inserted}, ` +
//       `updated: ${stats.updated}, ` +
//       `unchanged: ${stats.unchanged}`,
//   );

//   if (stats.inactive.length > 0) {
//     console.warn(
//       `[seed] ⚠️  Inactive system types left as-is: ${stats.inactive.join(
//         ", ",
//       )}. ` + `Re-enable from the dashboard if needed.`,
//     );
//   }
// };
