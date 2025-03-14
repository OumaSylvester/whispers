import sepertest from 'supertest'
import {app} from '../server'
import {restoreDb, populateDb} from './utils.js'
import { whispers, inventedId, existingId } from './fixtures'
import { getById } from '../store'
import supertest from 'supertest'

describe('Server', () => {
    beforeEach(() => {populateDb(whispers)})
    afterAll(restoreDb);
    
    describe("GET /api/v1/whisper", ()=>{
        it("Should return an empty array when there's no data", async () => {
            await restoreDb() //empty db
            const response = await supertest(app).get("/api/v1/whisper")
            expect(response.status).toBe(200)
            expect(response.body).toEqual([])
        })
        it("Should return all the whispers", async () => {
            const response = await sepertest(app).get("/api/v1/whisper")
            expect(response.status).toBe(200)
            expect(response.body).toEqual(whispers);
        })
    })

    describe("GET /api/v1/whisper:id", ()=>{
        it("Should return a 404 when the whisper doesn't exist", async () => {
            const response = await supertest(app).get(`/api/v1/whisper/${inventedId}`)
            expect(response.status).toBe(404)
        })
        it("Should return a whisper details", async () =>{
            const response = await supertest(app).get(`/api/v1/whisper/${existingId}`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual(whispers.find(w => w.id === existingId))
        })
    })

    describe("POST /api/v1/whisper", ()=>{
        it("Should return a 400 when the body is empty", async () => {
            const response = await supertest(app)
            .post("/api/v1/whisper")
            .send({})
            expect(response.status).toBe(400)
        })
        it("Should return a 400 when the body is invalid", async () => {
            const response = await supertest(app)
            .post("/api/v1/whisper")
            .send({inevented: "This is a new whisper"})
            expect(response.status).toBe(400)
        })
        it("Should return 201 when the wisper created", async () => {
            const newWhisper = {
                id: whispers.length + 1,
                message: "This is a new whisper"
            }
            const response = await supertest(app)
            .post("/api/v1/whisper")
            .send({message : newWhisper.message})
            // HTTP response
            expect(response.status).toBe(201)
            expect(response.body).toEqual(newWhisper)
            //Database changes
            const storedWhisper = await getById(newWhisper.id)
            expect(storedWhisper).toStrictEqual(newWhisper)
        })
    })

    describe("PUT /api/v1/whisper/:id", ()=>{
        it("Should return a 400 when the body is empty",
            async () => {
            const response = await supertest(app)
            .put(`/api/v1/whisper/${existingId}`)
            .send({})
            expect(response.status).toBe(400)
        })
        it("Should return a 400 when the body is invalid. Like when expected fields are missing", async () => {
            const response = await supertest(app)
            .put(`/api/v1/whisper/${existingId}`)
            .send({invented: "This is a new field"})
            expect(response.status).toBe(400)
        })
        it("Should return a 404 when the whisper doesn't exist", async () => {
            const response = await supertest(app)
            .put(`/api/v1/whisper/${inventedId}`)
            .send({message: "Whisper updated"})
            expect(response.status).toBe(404)
        })
        it("Should return a 200 when  the whisper is updated. Checks if whisper is added to db.", async () => {
            const response = await supertest(app)
            .put(`/api/v1/whisper/${existingId}`)
            .send({message: "Whisper updated"})
            expect(response.status).toBe(200)
            //Database changes
            const storedWhisper = await getById(existingId)
            expect(storedWhisper).toStrictEqual({id: existingId, message: "Whisper updated"})
        })
    })

    describe("DELETE /api/v1/whisper/:id", ()=>{
        it("Should return a 404 when the whisper doesn't exist", async () => {
            const response = await supertest(app)
            .delete(`/api/v1/whisper/${inventedId}`)
            expect(response.status).toBe(404)
        })
        it("Should return a 200 when the whisper is deleted", async () => {
            const response = await supertest(app)
            .delete(`/api/v1/whisper/${existingId}`)
            expect(response.status).toBe(200)
            // Database changes
            const storedWhisper = await getById(existingId)
            expect(storedWhisper).toBeUndefined()
        })
    })
})