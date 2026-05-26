import test from 'node:test';
import assert from 'node:assert/strict';
import { safeUserSchema } from '@/modules/user/user.schema';

test('safeUserSchema: valid payload passes validation', () => {
  const result = safeUserSchema.safeParse({
    userAccount: 'test_user',
  });
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.userAccount, 'test_user');
});

// test("registerSchema: valid payload passes validation", () => {
//   const result = registerSchema.safeParse({
//     userAccount: "test_user",
//     userPassword: "password123",
//     nickname: "tester",
//   });
//
//   assert.equal(result.success, true);
//   if (!result.success) return;
//   assert.equal(result.data.userAccount, "test_user");
//   assert.equal(result.data.userPassword, "password123");
// });
//
// test("registerSchema: requires userPassword", () => {
//   const result = registerSchema.safeParse({
//     userAccount: "test_user",
//   });
//
//   assert.equal(result.success, false);
// });
//
// test("registerSchema: requires one of userAccount/email/phone", () => {
//   const result = registerSchema.safeParse({
//     userPassword: "password123",
//   });
//
//   assert.equal(result.success, false);
//   if (result.success) return;
//   assert.equal(result.error.issues.some((issue) => issue.message.includes("至少填写一个")), true);
// });
//
// test("listUsersQuerySchema: applies defaults when page/pageSize/user missing", () => {
//   const result = listUsersQuerySchema.safeParse({});
//
//   assert.equal(result.success, true);
//   if (!result.success) return;
//   assert.equal(result.data.page, 1);
//   assert.equal(result.data.pageSize, 10);
//   assert.deepEqual(result.data.user, {});
// });
//
// test("listUsersQuerySchema: parses user from JSON string", () => {
//   const result = listUsersQuerySchema.safeParse({
//     page: "2",
//     pageSize: "20",
//     user: "{\"nickname\":\"tom\",\"gender\":\"1\"}",
//   });
//
//   assert.equal(result.success, true);
//   if (!result.success) return;
//   assert.equal(result.data.page, 2);
//   assert.equal(result.data.pageSize, 20);
//   assert.equal(result.data.user.nickname, "tom");
//   assert.equal(result.data.user.gender, 1);
// });
//
// test("listUsersQuerySchema: rejects invalid user JSON", () => {
//   const result = listUsersQuerySchema.safeParse({
//     user: "{bad-json",
//   });
//
//   assert.equal(result.success, false);
// });
